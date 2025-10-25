// Firebase type declarations and extensions

import type { User as FirebaseUser } from 'firebase/auth';

declare global {
  interface ImportMetaEnv {
    readonly VITE_FIREBASE_API_KEY: string;
    readonly VITE_FIREBASE_AUTH_DOMAIN: string;
    readonly VITE_FIREBASE_PROJECT_ID: string;
    readonly VITE_FIREBASE_STORAGE_BUCKET: string;
    readonly VITE_FIREBASE_MESSAGING_SENDER_ID: string;
    readonly VITE_FIREBASE_APP_ID: string;
  }

  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
}

export interface AuthUser extends FirebaseUser {
  role?: 'hr' | 'employee';
}

export interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<FirebaseUser>;
  signUp: (email: string, password: string, name: string) => Promise<FirebaseUser>;
  signOut: () => Promise<void>;
}