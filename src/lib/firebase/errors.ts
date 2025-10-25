// Firebase error handling utilities

import type { AuthError } from 'firebase/auth';

export interface FirebaseErrorInfo {
  code: string;
  message: string;
  userFriendlyMessage: string;
}

export const getAuthErrorInfo = (error: unknown): FirebaseErrorInfo => {
  if (error && typeof error === 'object' && 'code' in error) {
    const authError = error as AuthError;
    
    const errorMessages: Record<string, string> = {
      'auth/email-already-in-use': 'An account with this email already exists',
      'auth/weak-password': 'Password should be at least 6 characters',
      'auth/invalid-email': 'Please enter a valid email address',
      'auth/user-not-found': 'No account found with this email address',
      'auth/wrong-password': 'Incorrect password',
      'auth/too-many-requests': 'Too many failed attempts. Please try again later',
      'auth/network-request-failed': 'Network error. Please check your connection',
      'auth/internal-error': 'An internal error occurred. Please try again',
      'auth/invalid-credential': 'Invalid credentials provided',
      'auth/user-disabled': 'This account has been disabled',
      'auth/operation-not-allowed': 'This operation is not allowed',
      'auth/configuration-not-found': 'Firebase Authentication is not enabled. Please enable Email/Password authentication in Firebase Console.',
      'auth/app-not-authorized': 'This app is not authorized to use Firebase Authentication',
    };

    return {
      code: authError.code,
      message: authError.message,
      userFriendlyMessage: errorMessages[authError.code] || `Authentication error: ${authError.message}`
    };
  }

  return {
    code: 'unknown',
    message: error instanceof Error ? error.message : 'Unknown error',
    userFriendlyMessage: 'An unexpected error occurred. Please try again.'
  };
};

export const logFirebaseError = (context: string, error: unknown): void => {
  const errorInfo = getAuthErrorInfo(error);
  
  console.error(`🔥 Firebase Error [${context}]:`, {
    code: errorInfo.code,
    message: errorInfo.message,
    timestamp: new Date().toISOString()
  });
};