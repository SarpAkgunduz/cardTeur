import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signInAnonymously,
  linkWithCredential,
  linkWithPopup,
  EmailAuthProvider,
  GoogleAuthProvider,
  getAdditionalUserInfo,
  sendPasswordResetEmail,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import i18n from '../i18n';
import { auth } from '../firebase';
import { apiRequest } from '../services/api/apiClient';
import type { UserProfile, Plan, PlanLimits } from '../services/api/types';
import { PLAN_LIMITS } from '../services/api/types';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  profile: UserProfile | null;
  plan: Plan;
  limits: PlanLimits;
  // True for a Firebase Anonymous Auth session ("Uygulamayı Keşfet") that
  // hasn't been claimed into a real account yet.
  isGuest: boolean;
  refreshProfile: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<User>;
  signInWithGoogle: () => Promise<{ user: User; isNewUser: boolean }>;
  // Starts (or resumes) a guest session and provisions its Mongo user doc.
  // Same shape as a real signup from the caller's point of view.
  signInAsGuest: () => Promise<User>;
  resetPassword: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  const refreshProfile = useCallback(async () => {
    if (!auth.currentUser) {
      setProfile(null);
      return;
    }
    try {
      const data = await apiRequest<UserProfile>('/users/me');
      setProfile(data);
    } catch {
      setProfile(null);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
      if (user) {
        refreshProfile();
      } else {
        setProfile(null);
      }
    });
    return unsubscribe;
  }, [refreshProfile]);

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  const signIn = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signUp = async (email: string, password: string): Promise<User> => {
    // A guest is already signed in with a real Firebase user object — link
    // the new credential onto it instead of creating a second account, so
    // the uid (and everything already saved under it) carries forward.
    if (auth.currentUser?.isAnonymous) {
      const linkResult = await linkWithCredential(auth.currentUser, EmailAuthProvider.credential(email, password));
      await linkResult.user.getIdToken(true); // force a fresh token carrying the new email claim
      return linkResult.user;
    }
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    return credential.user;
  };

  const signInWithGoogle = async (): Promise<{ user: User; isNewUser: boolean }> => {
    const provider = new GoogleAuthProvider();
    if (auth.currentUser?.isAnonymous) {
      const linkResult = await linkWithPopup(auth.currentUser, provider);
      await linkResult.user.getIdToken(true);
      return { user: linkResult.user, isNewUser: false };
    }
    const credential = await signInWithPopup(auth, provider);
    return { user: credential.user, isNewUser: getAdditionalUserInfo(credential)?.isNewUser ?? false };
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

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#1A2B42' }}>
        <div className="spinner-border text-info" role="status" />
      </div>
    );
  }

  const plan: Plan = profile?.plan ?? 'free';
  const limits = PLAN_LIMITS[plan] ?? PLAN_LIMITS.free;

  const isGuest = currentUser?.isAnonymous ?? false;

  return (
    <AuthContext.Provider value={{ currentUser, loading, profile, plan, limits, isGuest, refreshProfile, signIn, signUp, signInWithGoogle, signInAsGuest, resetPassword, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
