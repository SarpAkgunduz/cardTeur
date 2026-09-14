import { apiRequest } from './apiClient';

export interface CrewVotingSettings {
  autoTriggerEnabled: boolean;
  windowHours: number;
}

export interface VotingSessionSummary {
  _id: string;
  status: 'open' | 'closed';
  closesAt: string;
}

export interface SessionParticipant {
  playerId: string;
  linkedUserId?: string;
  name: string;
}

export interface VotingSessionDetail {
  _id: string;
  status: 'open' | 'closed';
  closesAt: string;
  participants: SessionParticipant[];
}

export interface ParticipantPlayer {
  _id: string;
  name: string;
  preferredPosition?: string;
  cardImage?: string;
  linkedUserId?: string;
}

export const votingApi = {
  getSettings: (crewId: string) => apiRequest<CrewVotingSettings>(`/crews/${crewId}/voting-settings`),
  updateSettings: (crewId: string, patch: Partial<CrewVotingSettings>) => apiRequest<CrewVotingSettings>(`/crews/${crewId}/voting-settings`, {
    method: 'PUT',
    body: JSON.stringify(patch),
  }),
  getActiveSession: (crewId: string) => apiRequest<VotingSessionSummary | null>(`/crews/${crewId}/voting-sessions/active`),
  startSession: (crewId: string, participantPlayerIds: string[]) => apiRequest<VotingSessionSummary>(`/crews/${crewId}/voting-sessions`, {
    method: 'POST',
    body: JSON.stringify({ participantPlayerIds }),
  }),
  getSession: (sessionId: string) => apiRequest<{ session: VotingSessionDetail; players: ParticipantPlayer[] }>(`/voting-sessions/${sessionId}`),
  submitVote: (sessionId: string, targetPlayerId: string, statDeltas: Record<string, number>) => apiRequest(`/voting-sessions/${sessionId}/votes`, {
    method: 'POST',
    body: JSON.stringify({ targetPlayerId, statDeltas }),
  }),
};
