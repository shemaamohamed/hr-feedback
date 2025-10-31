'use client';

import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged
} from "firebase/auth";
import type { User as FirebaseUser, UserCredential } from "firebase/auth";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import { getStorage } from "firebase/storage"; // ✅ أضفنا دي
import { firebaseConfig } from "./config";
import { getAuthErrorInfo, logFirebaseError } from "./errors";

// Initialize Firebase with singleton pattern
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app); //

// Enhanced logging utility
const debugLog = (message: string, data?: unknown) => {
  if (process.env.NODE_ENV !== 'production') {
    console.log(`🔥 Firebase Auth: ${message}`, data);
  }
};



// User data interface for Firestore
export interface UserDocument {
  email: string;
  name: string;
  createdAt: Date;
  role?: 'hr' | 'employee';
}

// Additional utility functions
export async function getCurrentUser(): Promise<FirebaseUser | null> {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      resolve(user);
    });
  });
}

export async function getUserDocument(uid: string): Promise<UserDocument | null> {
  try {
    const { getDoc } = await import("firebase/firestore");
    const userDocRef = doc(db, "users", uid);
    const userDoc = await getDoc(userDocRef);
    
    if (userDoc.exists()) {
      const data = userDoc.data() as UserDocument;
      debugLog("Retrieved user document", { uid, data });
      return data;
    }
    
    debugLog("User document not found", { uid });
    return null;
  } catch (error) {
    console.error("Error fetching user document:", error);
    logFirebaseError("getUserDocument", error);
    return null;
  }
}
export async function signUp(email: string, password: string, name: string): Promise<FirebaseUser> {
  try {
    debugLog("Attempting to create user", { email, name });
    
    const userCredential: UserCredential = await createUserWithEmailAndPassword(auth, email, password);
    const { user } = userCredential;
    
    debugLog("User created successfully", { uid: user.uid, email: user.email });
    
    // Create user document in Firestore
    const userData: UserDocument = {
      email,
      name,
      createdAt: new Date(),
      role: email.includes('hr') ? 'hr' : 'employee'
    };
    
    await setDoc(doc(db, "users", user.uid), userData);
    debugLog("User document created in Firestore", { uid: user.uid });
    
    return user;
  } catch (error) {
    logFirebaseError("signUp", error);
    const errorInfo = getAuthErrorInfo(error);
    throw new Error(errorInfo.userFriendlyMessage);
  }
}

export async function signIn(email: string, password: string): Promise<FirebaseUser> {
  try {
    debugLog("Attempting to sign in user", { email });

    // تسجيل الدخول عادي
    const userCredential: UserCredential = await signInWithEmailAndPassword(auth, email, password);
    const { user } = userCredential;

    // نجيب بياناته من Firestore
    const userDoc = await getUserDocument(user.uid);

    // لو المستخدم مش HR → منعه
    if (!userDoc || userDoc.role !== "hr") {
      await signOut(auth);
      throw new Error("Access denied. Only HR users can sign in.");
    }

    debugLog("User signed in successfully (HR only)", { uid: user.uid, email: user.email });
    return user;

  } catch (error) {
    logFirebaseError("signIn", error);
    const errorInfo = getAuthErrorInfo(error);
    throw new Error(errorInfo.userFriendlyMessage || "Failed to sign in");
  }
}


export async function logOut(): Promise<void> {
  try {
    debugLog("Attempting to sign out user");
    await signOut(auth);
    debugLog("User signed out successfully");
  } catch (error) {
    logFirebaseError("logOut", error);
    throw new Error('Failed to sign out. Please try again.');
  }
}

export function subscribeToAuthState(callback: (user: FirebaseUser | null) => void): () => void {
  debugLog("Setting up auth state listener");
  
  return onAuthStateChanged(auth, (user) => {
    if (user) {
      debugLog("Auth state changed - user signed in", { uid: user.uid, email: user.email });
    } else {
      debugLog("Auth state changed - user signed out");
    }
    callback(user);
  }, (error) => {
    logFirebaseError("subscribeToAuthState", error);
  });
}
