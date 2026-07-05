import { getCurrentUserToken } from '../AuthService';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string) || 'https://cardteur-production.up.railway.app/api';

export class ApiError extends Error {
  status: number;
  code?: string;
  limit?: number;

  constructor(status: number, message: string, code?: string, limit?: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.limit = limit;
  }
}

export function isPlanLimitError(error: unknown): error is ApiError {
  return error instanceof ApiError && typeof error.code === 'string' && error.code.startsWith('PLAN_LIMIT_');
}

export async function apiRequest<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = await getCurrentUserToken();

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  });

  const contentType = response.headers.get('content-type');
  const hasJson = contentType != null && contentType.includes('application/json');

  if (!response.ok) {
    let message = `API Error: ${response.status} ${response.statusText}`;
    let code: string | undefined;
    let limit: number | undefined;
    if (hasJson) {
      try {
        const body = await response.json();
        if (body?.error) message = body.error;
        code = body?.code;
        limit = body?.limit;
      } catch {
        void 0;
      }
    }
    throw new ApiError(response.status, message, code, limit);
  }

  if (hasJson) {
    return await response.json();
  }

  return undefined as T;
}
