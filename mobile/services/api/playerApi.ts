import { apiRequest } from './apiClient';
import type { Player, CreatePlayerDto, UpdatePlayerDto } from './types';

export const playerApi = {
  getAll: () => apiRequest<Player[]>('/players'),
  getById: (id: string) => apiRequest<Player>(`/players/${id}`),
  create: (data: CreatePlayerDto) =>
    apiRequest<Player>('/players', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: UpdatePlayerDto) =>
    apiRequest<Player>(`/players/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => apiRequest<void>(`/players/${id}`, { method: 'DELETE' }),
};
