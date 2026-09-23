import { apiRequest } from './apiClient';
import type { AppUser } from './types';

export const userApi = {
  getMe: () => apiRequest<AppUser>('/users/me'),
  updateProfile: (updates: { displayName?: string; photoURL?: string }) =>
    apiRequest<AppUser>('/users/profile', { method: 'PUT', body: JSON.stringify(updates) }),
  search: (query: string) => apiRequest<AppUser[]>(`/users/search?q=${encodeURIComponent(query)}`),
  addFriend: (uid: string) =>
    apiRequest<void>(`/users/friends/${uid}`, { method: 'POST' }),
  removeFriend: (uid: string) =>
    apiRequest<void>(`/users/friends/${uid}`, { method: 'DELETE' }),
};
