import { getCurrentUserToken } from '../AuthService';

const API_BASE = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'https://cardteur-production.up.railway.app/api';

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await getCurrentUserToken();
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  const contentType = res.headers.get('content-type');
  if (contentType?.includes('application/json')) {
    return res.json();
  }
  return undefined as T;
}
