import { useEffect, useState } from 'react';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { auth } from '../firebase';
import { apiRequest } from '../services/api/apiClient';

WebBrowser.maybeCompleteAuthSession();

export function useGoogleSignIn(onSuccess?: () => void) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
  });

  useEffect(() => {
    if (!response) return;
    if (response.type === 'success') {
      const idToken = response.params?.id_token ?? (response as any).authentication?.idToken;
      if (!idToken) {
        setError('Google sign-in failed. Please try again.');
        setLoading(false);
        return;
      }
      handleCredential(idToken);
    } else if (response.type === 'error' || response.type === 'dismiss') {
      setLoading(false);
    }
  }, [response]);

  const handleCredential = async (idToken: string) => {
    try {
      const credential = GoogleAuthProvider.credential(idToken);
      const result = await signInWithCredential(auth, credential);
      const user = result.user;
      await apiRequest('/users/register', {
        method: 'POST',
        body: JSON.stringify({
          displayName: user.displayName || user.email?.split('@')[0] || 'User',
          photoURL: user.photoURL || '',
        }),
      });
      onSuccess?.();
    } catch {
      setError('Google sign-in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const signIn = () => {
    if (!request) return;
    setLoading(true);
    setError('');
    promptAsync();
  };

  return { signIn, loading, error, ready: !!request };
}
