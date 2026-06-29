import { apiRequest } from './apiClient';
import type { Crew } from './types';

export const crewApi = {
  getAll: () => apiRequest<Crew[]>('/crews'),
  getById: (id: string) => apiRequest<Crew>(`/crews/${id}`),
};
