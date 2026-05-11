import { auth } from '../firebase';

// Returns the current user's Firebase ID token for authenticated API requests
export async function getCurrentUserToken(): Promise<string | null> {
  const user = auth.currentUser;
  if (!user) return null;
  return user.getIdToken();
}
