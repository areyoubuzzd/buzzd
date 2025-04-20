import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider, 
  OAuthProvider,
  type Auth,
  type UserCredential
} from "firebase/auth";
import { firebaseConfig } from "../firebase-config";

// Initialize Firebase only if properly configured
let auth: Auth | null = null;
let app: any = null;

try {
  if (firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId) {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    console.log("Firebase initialized successfully");
  } else {
    console.warn("Firebase config is incomplete. Authentication features will be disabled.");
  }
} catch (error) {
  console.error("Firebase initialization error:", error);
}

// Import the necessary function for popup-based login
import { signInWithPopup } from "firebase/auth";

// Google authentication
const googleProvider = new GoogleAuthProvider();

export function signInWithGoogle(): Promise<UserCredential> {
  if (!auth) {
    throw new Error("Firebase authentication is not initialized");
  }
  
  try {
    // Use popup instead of redirect for development
    return signInWithPopup(auth, googleProvider);
  } catch (error: any) {
    console.error("Google sign-in error:", error);
    throw new Error(error?.message || "Failed to sign in with Google");
  }
}

// Apple authentication
const appleProvider = new OAuthProvider('apple.com');

export function signInWithApple(): Promise<UserCredential> {
  if (!auth) {
    throw new Error("Firebase authentication is not initialized");
  }
  
  try {
    // Use popup instead of redirect for development
    return signInWithPopup(auth, appleProvider);
  } catch (error: any) {
    console.error("Apple sign-in error:", error);
    throw new Error(error?.message || "Failed to sign in with Apple");
  }
}

// Get redirect result
export async function getAuthRedirectResult(): Promise<UserCredential | null> {
  if (!auth) {
    console.warn("Firebase authentication is not initialized");
    return null;
  }
  
  try {
    const result = await getRedirectResult(auth);
    return result;
  } catch (error: any) {
    console.error("Error getting redirect result:", error);
    throw error;
  }
}

// Check if Firebase Auth is properly configured
export function isFirebaseConfigured(): boolean {
  return !!(app && auth && firebaseConfig.apiKey && 
            firebaseConfig.projectId && 
            firebaseConfig.appId);
}

// Helper function for checking Firebase configuration details
export function checkFirebaseConfig(): { 
  hasApiKey: boolean; 
  hasProjectId: boolean; 
  hasAppId: boolean; 
  isComplete: boolean; 
} {
  const hasApiKey = !!firebaseConfig.apiKey;
  const hasProjectId = !!firebaseConfig.projectId;
  const hasAppId = !!firebaseConfig.appId;
  
  console.log("Checking Firebase configuration...");
  console.log("API Key available:", hasApiKey);
  console.log("Project ID available:", hasProjectId);
  console.log("App ID available:", hasAppId);
  
  return {
    hasApiKey,
    hasProjectId,
    hasAppId,
    isComplete: hasApiKey && hasProjectId && hasAppId
  };
}