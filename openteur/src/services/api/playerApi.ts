import { apiRequest } from './apiClient';
import { Player, CreatePlayerDto, UpdatePlayerDto } from './types';

export const playerApi = {
  /**
   * Tüm oyuncuları getir
   */
  getAll: () => apiRequest<Player[]>('/players'),

  /**
   * ID'ye göre tek oyuncu getir
   */
  getById: (id: string) => apiRequest<Player>(`/players/${id}`),

  /**
   * Yeni oyuncu oluştur
   */
  create: (playerData: CreatePlayerDto) =>
    apiRequest<Player>('/players', {
      method: 'POST',
      body: JSON.stringify(playerData),
    }),

  /**
   * Oyuncu güncelle
   */
  update: (id: string, playerData: UpdatePlayerDto) =>
    apiRequest<Player>(`/players/${id}`, {
      method: 'PUT',
      body: JSON.stringify(playerData),
    }),

  /**
   * Oyuncu sil
   */
  delete: (id: string) =>
    apiRequest<void>(`/players/${id}`, {
      method: 'DELETE',
    }),
};
