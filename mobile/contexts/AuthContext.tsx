import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInAnonymously,
  linkWithCredential,
  EmailAuthProvider,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { auth } from '../firebase';
import { userApi } from '../services/api/userApi';
import { apiRequest } from '../services/api/apiClient';
import i18n from '../i18n';
import type { Plan } from '../services/api/types';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  plan: Plan;
  isGuest: boolean;
  refreshProfile: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<User>;
  signInAsGuest: () => Promise<User>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [plan, setPlan] = useState<Plan>('free');

  const refreshProfile = useCallback(async () => {
    if (!auth.currentUser) {
      setPlan('free');
      return;
    }
    try {
      const me = await userApi.getMe();
      setPlan(me.plan ?? 'free');
    } catch {
      setPlan('free');
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
      if (user) {
        refreshProfile();
      } else {
        setPlan('free');
      }
    });
    return unsubscribe;
  }, [refreshProfile]);

  const signIn = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signUp = async (email: string, password: string): Promise<User> => {
    // A guest (anonymous) session claiming a real account links the new
    // credential onto the SAME Firebase user instead of creating a fresh
    // one — the uid stays identical, so every card/match the guest built
    // carries forward automatically with no data migration needed.
    if (auth.currentUser?.isAnonymous) {
      const credential = EmailAuthProvider.credential(email, password);
      const result = await linkWithCredential(auth.currentUser, credential);
      await result.user.getIdToken(true);
      return result.user;
    }
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    return credential.user;
  };

  const signInAsGuest = async (): Promise<User> => {
    const credential = await signInAnonymously(auth);
    try {
      await apiRequest('/users/register', {
        method: 'POST',
        body: JSON.stringify({ displayName: i18n.t('guest.defaultName') }),
      });
    } catch {
      // Non-fatal — refreshProfile will pick up the doc on its next call.
    }
    return credential.user;
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  const isGuest = currentUser?.isAnonymous ?? false;

  return (
    <AuthContext.Provider
      value={{ currentUser, loading, plan, isGuest, refreshProfile, signIn, signUp, signInAsGuest, signOut, resetPassword }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
