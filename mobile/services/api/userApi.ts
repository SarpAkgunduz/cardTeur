import { apiRequest } from './apiClient';
import type { AppUser } from './types';

export const userApi = {
  getMe: () => apiRequest<AppUser>('/users/me'),
  search: (query: string) => apiRequest<AppUser[]>(`/users/search?q=${encodeURIComponent(query)}`),
  addFriend: (uid: string) =>
    apiRequest<void>(`/users/friends/${uid}`, { method: 'POST' }),
  removeFriend: (uid: string) =>
    apiRequest<void>(`/users/friends/${uid}`, { method: 'DELETE' }),
};
