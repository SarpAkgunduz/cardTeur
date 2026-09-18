import { HydratedDocument } from 'mongoose';
import Crew, { ICrew } from '../models/Crew';
import Player from '../models/Player';
import VotingSession, { VotingSessionDoc } from '../models/VotingSession';
import Vote from '../models/Vote';
import { MatchDoc } from '../models/Match';
import { recomputeOveralls } from './playerOveralls';
import { getUserLimits } from './planService';

// Mongoose's hydrated document type (what find/findById/create actually
// resolve to) rather than the plain VotingSessionDoc interface, so
// reassigning between these functions type-checks.
type SessionDoc = HydratedDocument<VotingSessionDoc>;

// Which Player sub-stat keys a voting screen offers depends on the target's
// preferredPosition — see VOTING_SYSTEM_PLAN.md section 3.
export const OUTFIELD_STAT_KEYS = [
  'dribbling', 'shotAccuracy', 'shotSpeed', 'headers', 'shortPass', 'longPass', 'ballControl', 'positioning', 'vision',
  'tackling', 'interceptions', 'marking', 'defensiveIQ',
  'speed', 'strength', 'stamina',
] as const;

export const GK_STAT_KEYS = [
  'diving', 'handling', 'kicking', 'reflexes', 'gkPositioning', 'gkSpeed',
] as const;

export function statKeysFor(preferredPosition?: string): readonly string[] {
  return preferredPosition === 'GK' ? GK_STAT_KEYS : OUTFIELD_STAT_KEYS;
}

// Averages a set of votes' statDeltas per stat key, clamped to ±3 — the
// same math closeSession uses to apply votes to a Player, reused by the
// crew voting-stats analytics so the two never drift apart.
function averageStatDeltas(votes: Array<{ statDeltas: Map<string, number> }>): Map<string, number> {
  const sums = new Map<string, { total: number; count: number }>();
  for (const vote of votes) {
    for (const [key, delta] of vote.statDeltas.entries()) {
      const entry = sums.get(key) ?? { total: 0, count: 0 };
      entry.total += delta;
      entry.count += 1;
      sums.set(key, entry);
    }
  }
  const averaged = new Map<string, number>();
  for (const [key, { total, count }] of sums.entries()) {
    averaged.set(key, Math.max(-3, Math.min(3, Math.round(total / count))));
  }
  return averaged;
}

export class VotingError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

function isLeader(crew: ICrew, uid: string): boolean {
  return crew.ownerUid === uid || crew.editorUids.includes(uid);
}

export async function getCrew(crewId: string): Promise<ICrew> {
  const crew = await Crew.findById(crewId);
  if (!crew) throw new VotingError('Crew not found', 404);
  return crew;
}

export async function getVotingSettings(crewId: string, uid: string) {
  const crew = await getCrew(crewId);
  if (!isLeader(crew, uid)) throw new VotingError('Only the crew leader can view voting settings', 403);
  return crew.votingSettings;
}

export async function updateVotingSettings(
  crewId: string,
  uid: string,
  patch: { autoTriggerEnabled?: boolean; windowHours?: number },
) {
  const crew = await getCrew(crewId);
  if (!isLeader(crew, uid)) throw new VotingError('Only the crew leader can edit voting settings', 403);
  if (typeof patch.autoTriggerEnabled === 'boolean') {
    crew.votingSettings.autoTriggerEnabled = patch.autoTriggerEnabled;
  }
  if (typeof patch.windowHours === 'number' && patch.windowHours > 0) {
    crew.votingSettings.windowHours = patch.windowHours;
  }
  await crew.save();
  return crew.votingSettings;
}

// Lazily closes any session whose window has passed — called before reading
// or writing a session, per VOTING_SYSTEM_PLAN.md section 6 (no scheduled job).
async function closeIfExpired(session: SessionDoc): Promise<SessionDoc> {
  if (session.status === 'open' && session.closesAt.getTime() <= Date.now()) {
    return closeSession(String(session._id));
  }
  return session;
}

export async function getActiveSession(crewId: string): Promise<SessionDoc | null> {
  const openSessions = await VotingSession.find({ crewId, status: 'open' });
  for (const session of openSessions) {
    await closeIfExpired(session);
  }
  return VotingSession.findOne({ crewId, status: 'open' }).sort({ createdAt: -1 });
}

// Powers VotingPage — needs the session plus enough of each participant's
// Player doc (preferredPosition drives which stat set the voting screen
// shows) to render. Any crew member can view (owner/editor/memberUids),
// not just people who played that specific match.
export async function getSessionForViewer(sessionId: string, uid: string) {
  let session = await VotingSession.findById(sessionId);
  if (!session) throw new VotingError('Voting session not found', 404);
  session = await closeIfExpired(session);

  const crew = await getCrew(String(session.crewId));
  const isMember = crew.ownerUid === uid || crew.editorUids.includes(uid) || crew.memberUids.includes(uid);
  if (!isMember) throw new VotingError('You are not a member of this crew', 403);

  const playerIds = session.participants.map(p => p.playerId);
  const players = await Player.find({ _id: { $in: playerIds } }).select('name preferredPosition cardImage linkedUserId');
  return { session, players };
}

export async function createManualSession(
  crewId: string,
  uid: string,
  participantPlayerIds: string[],
  windowHoursOverride?: number,
): Promise<SessionDoc> {
  const crew = await getCrew(crewId);
  if (!isLeader(crew, uid)) throw new VotingError('Only the crew leader can start a voting session', 403);
  if (!participantPlayerIds?.length) throw new VotingError('At least one participant is required');

  const players = await Player.find({ _id: { $in: participantPlayerIds } }).select('name linkedUserId');
  if (!players.length) throw new VotingError('No matching players found for the given ids', 404);

  const windowHours = windowHoursOverride && windowHoursOverride > 0
    ? windowHoursOverride
    : crew.votingSettings.windowHours;
  const opensAt = new Date();
  const closesAt = new Date(opensAt.getTime() + windowHours * 60 * 60 * 1000);

  return VotingSession.create({
    crewId: crew._id,
    participants: players.map(p => ({
      playerId: p._id,
      linkedUserId: p.linkedUserId,
      name: p.name ?? 'Unknown',
    })),
    status: 'open',
    opensAt,
    closesAt,
    createdByUid: uid,
    statsApplied: false,
  });
}

// Called from the match-announce hook when the match's crew has auto-trigger
// enabled. Builds participants from the roster snapshot already on the
// match — this is why MatchPlayerDoc.playerId needs to exist.
export async function createSessionFromMatch(match: MatchDoc, uid: string): Promise<SessionDoc | null> {
  if (!match.crewId) return null;
  const crew = await Crew.findById(match.crewId);
  if (!crew?.votingSettings.autoTriggerEnabled) return null;

  const rosterPlayers = [...match.teamA.players, ...match.teamB.players].filter(p => p.playerId);
  if (!rosterPlayers.length) return null;

  const opensAt = new Date();
  const closesAt = new Date(opensAt.getTime() + crew.votingSettings.windowHours * 60 * 60 * 1000);

  return VotingSession.create({
    crewId: crew._id,
    matchId: match._id,
    participants: rosterPlayers.map(p => ({
      playerId: p.playerId,
      linkedUserId: p.linkedUserId,
      name: p.name,
    })),
    status: 'open',
    opensAt,
    closesAt,
    createdByUid: uid,
    statsApplied: false,
  });
}

export async function submitVote(
  sessionId: string,
  voterUid: string,
  targetPlayerId: string,
  statDeltas: Record<string, number>,
) {
  let session = await VotingSession.findById(sessionId);
  if (!session) throw new VotingError('Voting session not found', 404);
  session = await closeIfExpired(session);
  if (session.status !== 'open') throw new VotingError('This voting session is closed', 409);

  const participant = session.participants.find(p => String(p.playerId) === String(targetPlayerId));
  if (!participant) throw new VotingError('That player is not part of this voting session', 400);
  if (participant.linkedUserId && participant.linkedUserId === voterUid) {
    throw new VotingError('You cannot vote on your own card', 400);
  }

  const target = await Player.findById(targetPlayerId).select('preferredPosition');
  if (!target) throw new VotingError('Target player not found', 404);
  const allowedKeys = new Set(statKeysFor(target.preferredPosition));

  const cleanDeltas: Record<string, number> = {};
  for (const [key, rawValue] of Object.entries(statDeltas ?? {})) {
    if (!allowedKeys.has(key)) continue;
    const value = Math.round(Number(rawValue));
    if (!Number.isFinite(value) || value === 0) continue;
    cleanDeltas[key] = Math.max(-3, Math.min(3, value));
  }

  const vote = await Vote.findOneAndUpdate(
    { sessionId: session._id, voterUid, targetPlayerId },
    { $set: { statDeltas: cleanDeltas } },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
  return vote;
}

// requireLeaderUid: pass this when closing is an explicit user action, so an
// early close (before closesAt) is restricted to the crew leader. Omit it
// for the lazy/system path (the window already passed — anyone reading the
// session can trigger the tally, there's nothing left to "early close").
export async function closeSession(sessionId: string, requireLeaderUid?: string): Promise<SessionDoc> {
  const session = await VotingSession.findById(sessionId);
  if (!session) throw new VotingError('Voting session not found', 404);

  if (requireLeaderUid && session.status === 'open' && session.closesAt.getTime() > Date.now()) {
    const crew = await getCrew(String(session.crewId));
    if (!isLeader(crew, requireLeaderUid)) {
      throw new VotingError('Only the crew leader can close a voting session early', 403);
    }
  }

  if (session.statsApplied) {
    session.status = 'closed';
    await session.save();
    return session;
  }

  const votes = await Vote.find({ sessionId: session._id });
  const votesByTarget = new Map<string, typeof votes>();
  for (const vote of votes) {
    const key = String(vote.targetPlayerId);
    const list = votesByTarget.get(key) ?? [];
    list.push(vote);
    votesByTarget.set(key, list);
  }

  for (const participant of session.participants) {
    const targetVotes = votesByTarget.get(String(participant.playerId)) ?? [];
    if (!targetVotes.length) continue;

    const player = await Player.findById(participant.playerId);
    if (!player) continue;

    // Average the submitted deltas per stat across only the voters who
    // touched it — a stat nobody voted on is skipped entirely.
    const avgDeltas = averageStatDeltas(targetVotes);

    for (const [key, avgDelta] of avgDeltas.entries()) {
      const current = (player as unknown as Record<string, number | undefined>)[key] ?? 0;
      (player as unknown as Record<string, number>)[key] = Math.max(1, Math.min(99, current + avgDelta));
    }

    const overalls = recomputeOveralls(player);
    player.offensiveOverall = overalls.offensiveOverall;
    player.defensiveOverall = overalls.defensiveOverall;
    player.athleticismOverall = overalls.athleticismOverall;
    player.gkOverall = overalls.gkOverall;
    await player.save();
  }

  session.status = 'closed';
  session.statsApplied = true;
  await session.save();
  return session;
}

// Powers the Development Center's leader-facing analytics panel — Premium+
// only (crew.analytics plan flag), gated on the crew OWNER's plan since the
// crew's paid features are tied to whoever pays for it, not the viewing
// leader (who may be an editor on someone else's crew).
export async function getCrewVotingStats(crewId: string, uid: string) {
  const crew = await getCrew(crewId);
  if (!isLeader(crew, uid)) throw new VotingError('Only the crew leader can view voting analytics', 403);

  const { analytics } = await getUserLimits(crew.ownerUid);
  if (!analytics) throw new VotingError('Voting analytics is a Premium+ feature', 403);

  const sessions = await VotingSession.find({ crewId: crew._id })
    .select('_id status statsApplied participants');
  const sessionIds = sessions.map(s => s._id);
  const votes = sessionIds.length ? await Vote.find({ sessionId: { $in: sessionIds } }) : [];

  const votesBySession = new Map<string, typeof votes>();
  for (const vote of votes) {
    const key = String(vote.sessionId);
    const list = votesBySession.get(key) ?? [];
    list.push(vote);
    votesBySession.set(key, list);
  }

  let participationSum = 0;
  let participationSessions = 0;
  for (const session of sessions) {
    const roster = session.participants.length;
    if (!roster) continue;
    const sessionVotes = votesBySession.get(String(session._id)) ?? [];
    const distinctVoters = new Set(sessionVotes.map(v => v.voterUid)).size;
    participationSum += distinctVoters / roster;
    participationSessions += 1;
  }
  const avgParticipationPct = participationSessions
    ? Math.round((participationSum / participationSessions) * 100)
    : 0;

  const improvementByPlayer = new Map<string, { name: string; total: number }>();
  for (const session of sessions.filter(s => s.statsApplied)) {
    const sessionVotes = votesBySession.get(String(session._id)) ?? [];
    const votesByTarget = new Map<string, typeof sessionVotes>();
    for (const vote of sessionVotes) {
      const key = String(vote.targetPlayerId);
      const list = votesByTarget.get(key) ?? [];
      list.push(vote);
      votesByTarget.set(key, list);
    }
    for (const participant of session.participants) {
      const targetVotes = votesByTarget.get(String(participant.playerId)) ?? [];
      if (!targetVotes.length) continue;
      const avgDeltas = averageStatDeltas(targetVotes);
      let sessionImprovement = 0;
      for (const delta of avgDeltas.values()) sessionImprovement += delta;

      const key = String(participant.playerId);
      const entry = improvementByPlayer.get(key) ?? { name: participant.name, total: 0 };
      entry.total += sessionImprovement;
      improvementByPlayer.set(key, entry);
    }
  }

  const mostImproved = [...improvementByPlayer.entries()]
    .map(([playerId, { name, total }]) => ({ playerId, name, totalImprovement: total }))
    .filter(p => p.totalImprovement > 0)
    .sort((a, b) => b.totalImprovement - a.totalImprovement)
    .slice(0, 3);

  return {
    totalSessions: sessions.length,
    closedSessions: sessions.filter(s => s.status === 'closed').length,
    totalVotesCast: votes.length,
    avgParticipationPct,
    mostImproved,
  };
}

// Powers the Development Center's player-facing "Voting Center" tab — every
// open voting session across every crew the user belongs to (owner, editor,
// member, or via a linked player card), so a non-leader has something to do
// on this page too instead of just the leader-only "create a crew" message.
export async function getActiveSessionsForUser(uid: string) {
  const linkedPlayers = await Player.find({ linkedUserId: uid }).select('_id').lean();
  const linkedPlayerIds = linkedPlayers.map(p => String(p._id));

  const crews = await Crew.find({
    $or: [
      { ownerUid: uid },
      { memberUids: uid },
      { editorUids: uid },
      { playerIds: { $in: linkedPlayerIds } },
    ],
  }).select('_id name');
  if (!crews.length) return [];

  const crewIds = crews.map(c => c._id);
  const openSessions = await VotingSession.find({ crewId: { $in: crewIds }, status: 'open' })
    .sort({ closesAt: 1 });

  const crewNameById = new Map(crews.map(c => [String(c._id), c.name]));
  const results = [];
  for (const session of openSessions) {
    const settled = await closeIfExpired(session);
    if (settled.status !== 'open') continue;
    results.push({
      _id: settled._id,
      crewId: settled.crewId,
      crewName: crewNameById.get(String(settled.crewId)) ?? '',
      closesAt: settled.closesAt,
      participantCount: settled.participants.length,
    });
  }
  return results;
}
