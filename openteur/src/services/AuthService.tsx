import { setWithExpiry, getWithExpiry, remove } from "../utils/Storage";

const SESSION_KEY = "openteur:auth:session";
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days set for expiry, can be adjusted as needed, but now it's static.

export type SessionValue = { isAuthenticated: boolean };

export function loginSuccess(): void {
  // after a successful login call this to set session
  setWithExpiry<SessionValue>(SESSION_KEY, { isAuthenticated: true }, SESSION_TTL_MS);
}

export function getSession(): SessionValue | null {
  return getWithExpiry<SessionValue>(SESSION_KEY);
}

export function isLoggedIn(): boolean {
  return getSession()?.isAuthenticated === true;
}

export function logout(): void {
  remove(SESSION_KEY);
}
