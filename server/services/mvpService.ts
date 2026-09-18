import Crew, { ICrew } from '../models/Crew';
import Player from '../models/Player';
import MvpAward from '../models/MvpAward';
import { recomputeOveralls } from './playerOveralls';
import { statKeysFor } from './votingService';

export class MvpError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

function isLeader(crew: ICrew, uid: string): boolean {
  return crew.ownerUid === uid || crew.editorUids.includes(uid);
}

// Leader-only — picks the MVP for a crew. The +1 stat itself is not applied
// here: the awarded player claims it later and picks the stat themselves
// (see claimMvpAward), so the card can only be linked to an account.
export async function awardMvp(crewId: string, uid: string, playerId: string) {
  const crew = await Crew.findById(crewId);
  if (!crew) throw new MvpError('Crew not found', 404);
  if (!isLeader(crew, uid)) throw new MvpError('Only the crew leader can select the MVP', 403);
  if (!crew.playerIds.map(String).includes(String(playerId))) {
    throw new MvpError('That player is not part of this crew', 400);
  }

  const player = await Player.findById(playerId).select('linkedUserId name');
  if (!player) throw new MvpError('Player not found', 404);
  if (!player.linkedUserId) {
    throw new MvpError('This player card is not linked to an account, so they cannot pick their own stat', 400);
  }

  return MvpAward.create({
    crewId: crew._id,
    playerId: player._id,
    linkedUserId: player.linkedUserId,
    awardedByUid: uid,
    claimed: false,
  });
}

// Every unclaimed MVP award for this user, across any of their linked player
// cards, with the stat options they're allowed to choose from for each.
export async function getPendingMvpAwardsForUser(uid: string) {
  const awards = await MvpAward.find({ linkedUserId: uid, claimed: false }).sort({ createdAt: -1 });
  if (!awards.length) return [];

  const playerIds = [...new Set(awards.map(a => String(a.playerId)))];
  const players = await Player.find({ _id: { $in: playerIds } }).select('name preferredPosition');
  const playerById = new Map(players.map(p => [String(p._id), p]));

  return awards.map(award => {
    const player = playerById.get(String(award.playerId));
    return {
      _id: award._id,
      playerId: award.playerId,
      playerName: player?.name ?? '',
      statOptions: statKeysFor(player?.preferredPosition),
      createdAt: award.createdAt,
    };
  });
}

export async function claimMvpAward(awardId: string, uid: string, stat: string) {
  const award = await MvpAward.findById(awardId);
  if (!award) throw new MvpError('MVP award not found', 404);
  if (award.linkedUserId !== uid) throw new MvpError('This MVP award is not yours to claim', 403);
  if (award.claimed) throw new MvpError('This MVP award has already been claimed', 409);

  const player = await Player.findById(award.playerId);
  if (!player) throw new MvpError('Player not found', 404);

  const allowed = new Set(statKeysFor(player.preferredPosition));
  if (!allowed.has(stat)) throw new MvpError('That stat is not available for this player', 400);

  const current = (player as unknown as Record<string, number | undefined>)[stat] ?? 0;
  (player as unknown as Record<string, number>)[stat] = Math.max(1, Math.min(99, current + 1));

  const overalls = recomputeOveralls(player);
  player.offensiveOverall = overalls.offensiveOverall;
  player.defensiveOverall = overalls.defensiveOverall;
  player.athleticismOverall = overalls.athleticismOverall;
  player.gkOverall = overalls.gkOverall;
  await player.save();

  award.claimed = true;
  award.chosenStat = stat;
  award.claimedAt = new Date();
  await award.save();

  return award;
}
