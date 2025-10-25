'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User as FirebaseUser } from 'firebase/auth';
import { 
  signUp as firebaseSignUp, 
  signIn as firebaseSignIn, 
  logOut as firebaseLogOut, 
  subscribeToAuthState,
  getUserDocument
} from '@/lib/firebase/auth';


interface AuthUser extends FirebaseUser {
  role?: 'hr' | 'employee';
  name?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToAuthState(async (firebaseUser) => {
      if (firebaseUser) {
        // Get additional user data from Firestore
        const userDoc = await getUserDocument(firebaseUser.uid);
        const authUser: AuthUser = {
          ...firebaseUser,
          role: userDoc?.role || (firebaseUser.email?.includes('hr') ? 'hr' : 'employee'),
          name: userDoc?.name
        };
        setUser(authUser);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      await firebaseSignIn(email, password);
      // User state will be updated by the auth state listener
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    setLoading(true);
    try {
      await firebaseSignUp(email, password, name);
      // User state will be updated by the auth state listener
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      await firebaseLogOut();
      // User state will be updated by the auth state listener
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};