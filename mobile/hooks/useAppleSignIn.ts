import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';

export function useAppleSignIn(onSuccess?: () => void) {
  const { t } = useTranslation();
  const { signInWithApple } = useAuth();
  const [available, setAvailable] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (Platform.OS !== 'ios') {
      setAvailable(false);
      return;
    }
    AppleAuthentication.isAvailableAsync().then(setAvailable).catch(() => setAvailable(false));
  }, []);

  const signIn = async () => {
    if (loading) return;
    setLoading(true);
    setError('');
    try {
      // A fresh random nonce per attempt, hashed for the Apple request and
      // passed raw to Firebase — Firebase re-hashes it and checks it matches
      // the hash inside the identity token, which stops a captured token
      // from being replayed in a different sign-in attempt.
      const rawNonce = Crypto.randomUUID();
      const hashedNonce = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, rawNonce);

      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
        nonce: hashedNonce,
      });

      if (!credential.identityToken) {
        setError(t('auth.appleFailed'));
        return;
      }

      // Apple only ever sends the name on the FIRST authorization for a
      // given account — later sign-ins return null here, so we only have
      // one chance to capture it for the account's display name.
      const displayName = credential.fullName
        ? [credential.fullName.givenName, credential.fullName.familyName].filter(Boolean).join(' ').trim()
        : undefined;

      await signInWithApple(credential.identityToken, rawNonce, displayName || undefined);
      onSuccess?.();
    } catch (err) {
      const code = (err as { code?: string })?.code;
      if (code === 'ERR_REQUEST_CANCELED') {
        // User dismissed the Apple sheet — not an error worth surfacing.
      } else if (code === 'auth/credential-already-in-use') {
        setError(t('guest.claimEmailInUse'));
      } else {
        setError(t('auth.appleFailed'));
      }
    } finally {
      setLoading(false);
    }
  };

  return { signIn, loading, error, available };
}
