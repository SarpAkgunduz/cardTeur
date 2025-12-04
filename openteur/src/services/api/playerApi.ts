import { apiRequest } from './apiClient';
import { Player, CreatePlayerDto, UpdatePlayerDto } from './types';

export const playerApi = {
  /**
   * Get all players
   */
  getAll: () => apiRequest<Player[]>('/players'),

  /**
   * get player by id
   */
  getById: (id: string) => apiRequest<Player>(`/players/${id}`),

  /**
   * Create new player
   */
  create: (playerData: CreatePlayerDto) =>
    apiRequest<Player>('/players', {
      method: 'POST',
      body: JSON.stringify(playerData),
    }),

  /**
   * Update/edit existing player
   */
  update: (id: string, playerData: UpdatePlayerDto) =>
    apiRequest<Player>(`/players/${id}`, {
      method: 'PUT',
      body: JSON.stringify(playerData),
    }),

  /**
   * Delete player by id
   */
  delete: (id: string) =>
    apiRequest<void>(`/players/${id}`, {
      method: 'DELETE',
    }),
};
