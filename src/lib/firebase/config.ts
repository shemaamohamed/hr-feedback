"use client";

// Read NEXT_PUBLIC_ environment variables directly. Using dynamic access like
// process.env[`NEXT_PUBLIC_${key}`] prevents Next from inlining the values, so
// read each variable explicitly so they become build-time constants.
const NEXT_PUBLIC_FIREBASE_API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY as string | undefined;
const NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN as string | undefined;
const NEXT_PUBLIC_FIREBASE_PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID as string | undefined;
const NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET as string | undefined;
const NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID = process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID as string | undefined;
const NEXT_PUBLIC_FIREBASE_APP_ID = process.env.NEXT_PUBLIC_FIREBASE_APP_ID as string | undefined;

// If NEXT_PUBLIC_USE_TEST_FIREBASE is set to 'true', use the test fallback config when
// real env vars are missing. Default is false (use real env values and throw if missing).
const USE_TEST_CONFIG = process.env.NEXT_PUBLIC_USE_TEST_FIREBASE === 'true';

// Minimal test fallback (safe to include for local development). Only used when
// USE_TEST_CONFIG is true and the corresponding NEXT_PUBLIC_ env var is missing.


// Firebase configuration - reads from NEXT_PUBLIC_* env vars, with optional test fallbacks
export const firebaseConfig = {
  apiKey: NEXT_PUBLIC_FIREBASE_API_KEY ,
  authDomain: NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ,
  projectId: NEXT_PUBLIC_FIREBASE_PROJECT_ID ,
  storageBucket: NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ,
  messagingSenderId: NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ,
  appId: NEXT_PUBLIC_FIREBASE_APP_ID ,
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
  const usingEnvVars = !!NEXT_PUBLIC_FIREBASE_API_KEY;
  console.log('🔥 Firebase config loaded:', {
    projectId: firebaseConfig.projectId,
    authDomain: firebaseConfig.authDomain,
    hasApiKey: !!firebaseConfig.apiKey,
    source: usingEnvVars ? '📁 .env.local' : '� fallback config',
    testMode: USE_TEST_CONFIG
  });
}


