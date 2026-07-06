import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
} from 'firebase/auth';
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
  refreshProfile: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<User>;
  signInWithGoogle: () => Promise<User>;
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

  const signIn = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signUp = async (email: string, password: string): Promise<User> => {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    return credential.user;
  };

  const signInWithGoogle = async (): Promise<User> => {
    const provider = new GoogleAuthProvider();
    const credential = await signInWithPopup(auth, provider);
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

  return (
    <AuthContext.Provider value={{ currentUser, loading, profile, plan, limits, refreshProfile, signIn, signUp, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
