'use client';

// Get environment variables (Next.js uses NEXT_PUBLIC_ prefix for client-side)
const getEnvVar = (key: string): string | undefined => {
  if (typeof window !== 'undefined') {
    return process.env[`NEXT_PUBLIC_${key}`];
  }
  return undefined;
};

// Determine which config to use
const USE_TEST_CONFIG = process.env.NEXT_PUBLIC_USE_TEST_FIREBASE === 'true';

// Fallback configuration if env vars are not set


// Firebase configuration - reads from .env.local or uses fallback
export const firebaseConfig = {
  apiKey: getEnvVar('FIREBASE_API_KEY') ,
  authDomain: getEnvVar('FIREBASE_AUTH_DOMAIN') ,
  projectId: getEnvVar('FIREBASE_PROJECT_ID') ,
  storageBucket: getEnvVar('FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: getEnvVar('FIREBASE_MESSAGING_SENDER_ID') ,
  appId: getEnvVar('FIREBASE_APP_ID') ,
};

// Validate required configuration
const requiredConfig = ['apiKey', 'authDomain', 'projectId'];
const missingConfig = requiredConfig.filter(key => !firebaseConfig[key as keyof typeof firebaseConfig]);

if (missingConfig.length > 0) {
  console.error('❌ Missing Firebase configuration:', missingConfig);
  throw new Error(`Missing required Firebase configuration: ${missingConfig.join(', ')}`);
}

// Log config in development mode
if (process.env.NODE_ENV !== 'production') {
  const usingEnvVars = !!getEnvVar('FIREBASE_API_KEY');
  console.log('🔥 Firebase config loaded:', {
    projectId: firebaseConfig.projectId,
    authDomain: firebaseConfig.authDomain,
    hasApiKey: !!firebaseConfig.apiKey,
    source: usingEnvVars ? '📁 .env.local' : '� fallback config',
    testMode: USE_TEST_CONFIG
  });
}


