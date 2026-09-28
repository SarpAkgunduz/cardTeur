import { useEffect, useState } from 'react';
import * as Google from 'expo-auth-session/providers/google';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { GoogleAuthProvider, signInWithCredential, linkWithCredential, getAdditionalUserInfo } from 'firebase/auth';
import { useTranslation } from 'react-i18next';
import { auth } from '../firebase';
import { apiRequest } from '../services/api/apiClient';

WebBrowser.maybeCompleteAuthSession();

export function useGoogleSignIn(onSuccess?: (isNewUser: boolean) => void) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Google's iOS OAuth client requires the redirect to land on its own
  // "reversed client ID" URL scheme (com.googleusercontent.apps.<id>), not
  // our app's own "cardteurmobile" scheme — using the wrong one is exactly
  // what produces Google's "Error 400: invalid_request ... doesn't comply
  // with Google's OAuth 2.0 policy" on-device. That scheme must also be
  // registered in app.json's `scheme` array so iOS routes the redirect back
  // into the app at all.
  const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ?? '';
  const iosReversedScheme = iosClientId
    ? `com.googleusercontent.apps.${iosClientId.replace('.apps.googleusercontent.com', '')}`
    : undefined;

  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    iosClientId: iosClientId || undefined,
    redirectUri: iosReversedScheme
      ? AuthSession.makeRedirectUri({ scheme: iosReversedScheme })
      : undefined,
  });

  useEffect(() => {
    if (!response) return;
    if (response.type === 'success') {
      const idToken = response.params?.id_token ?? (response as any).authentication?.idToken;
      if (!idToken) {
        setError(t('auth.googleFailed'));
        setLoading(false);
        return;
      }
      handleCredential(idToken);
    } else if (response.type === 'error' || response.type === 'dismiss') {
      // Logged so a silent redirect failure (e.g. the native URL scheme
      // from app.json not actually being in the installed build yet,
      // which needs a fresh `npx expo run:ios --device`, not just a JS
      // reload) shows up somewhere instead of just leaving the button spun
      // forever on some other stuck state.
      if (response.type === 'error') console.error('[useGoogleSignIn] auth response error:', response);
      setLoading(false);
    }
  }, [response]);

  const handleCredential = async (idToken: string) => {
    try {
      const credential = GoogleAuthProvider.credential(idToken);
      // A guest (anonymous) session claiming via Google links onto the
      // SAME Firebase user rather than signing into a separate one, so
      // the uid — and every card/match already built as a guest — stays
      // intact. But if this Google account is already tied to a real,
      // existing account, linking fails ("already in use") — that just
      // means the person is logging back INTO that account rather than
      // creating one, so fall back to a normal sign-in instead of leaving
      // them stuck on an error with no way to actually log in.
      let result;
      if (auth.currentUser?.isAnonymous) {
        try {
          result = await linkWithCredential(auth.currentUser, credential);
        } catch (err) {
          const code = (err as { code?: string })?.code;
          if (code === 'auth/credential-already-in-use' || code === 'auth/email-already-in-use') {
            result = await signInWithCredential(auth, credential);
          } else {
            throw err;
          }
        }
      } else {
        result = await signInWithCredential(auth, credential);
      }
      const isNewUser = getAdditionalUserInfo(result)?.isNewUser ?? false;
      const user = result.user;
      await apiRequest('/users/register', {
        method: 'POST',
        body: JSON.stringify({
          displayName: user.displayName || user.email?.split('@')[0] || 'User',
          photoURL: user.photoURL || '',
        }),
      });
      onSuccess?.(isNewUser);
    } catch (err) {
      const code = (err as { code?: string })?.code;
      if (code === 'auth/credential-already-in-use') {
        setError(t('guest.claimEmailInUse'));
      } else {
        console.error('[useGoogleSignIn] handleCredential failed:', code, err);
        setError(t('auth.googleFailed'));
      }
    } finally {
      setLoading(false);
    }
  };

  const signIn = () => {
    if (!request) return;
    setLoading(true);
    setError('');
    promptAsync().catch((err) => {
      // promptAsync() itself can reject (rather than resolving with a
      // {type:'error'} response the useEffect above would catch) — e.g.
      // when the native redirect scheme registered in app.json isn't
      // actually present in the installed build yet (needs a fresh
      // `npx expo run:ios --device`, not just a JS/Metro reload). Without
      // this the button just spun forever with nothing in the console.
      console.error('[useGoogleSignIn] promptAsync rejected:', err);
      setError(t('auth.googleFailed'));
      setLoading(false);
    });
  };

  return { signIn, loading, error, ready: !!request };
}
