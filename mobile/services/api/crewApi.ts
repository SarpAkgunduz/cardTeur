import { apiRequest } from './apiClient';
import type { Crew } from './types';

export const crewApi = {
  getAll: () => apiRequest<Crew[]>('/crews'),
  getById: (id: string) => apiRequest<Crew>(`/crews/${id}`),
  create: (name: string) =>
    apiRequest<Crew>('/crews', { method: 'POST', body: JSON.stringify({ name }) }),
  rename: (id: string, name: string) =>
    apiRequest<Crew>(`/crews/${id}`, { method: 'PUT', body: JSON.stringify({ name }) }),
  delete: (id: string) => apiRequest<void>(`/crews/${id}`, { method: 'DELETE' }),
  addPlayer: (crewId: string, playerId: string) =>
    apiRequest<Crew>(`/crews/${crewId}/players/${playerId}`, { method: 'POST' }),
  removePlayer: (crewId: string, playerId: string) =>
    apiRequest<Crew>(`/crews/${crewId}/players/${playerId}`, { method: 'DELETE' }),
  addEditor: (crewId: string, editorUid: string) =>
    apiRequest<Crew>(`/crews/${crewId}/editors/${editorUid}`, { method: 'POST' }),
  removeEditor: (crewId: string, editorUid: string) =>
    apiRequest<Crew>(`/crews/${crewId}/editors/${editorUid}`, { method: 'DELETE' }),
};
