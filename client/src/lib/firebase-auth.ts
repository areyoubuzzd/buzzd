import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  OAuthProvider,
  signInWithPhoneNumber,
  RecaptchaVerifier,
  type ConfirmationResult,
  type Auth
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

// Google authentication
const googleProvider = new GoogleAuthProvider();

export async function signInWithGoogle(): Promise<string> {
  if (!auth) {
    throw new Error("Firebase authentication is not initialized");
  }
  
  try {
    const result = await signInWithPopup(auth, googleProvider);
    // Get the ID token
    const idToken = await result.user.getIdToken();
    return idToken;
  } catch (error: any) {
    console.error("Google sign-in error:", error);
    throw new Error(error?.message || "Failed to sign in with Google");
  }
}

// Apple authentication
const appleProvider = new OAuthProvider('apple.com');

export async function signInWithApple(): Promise<string> {
  if (!auth) {
    throw new Error("Firebase authentication is not initialized");
  }
  
  try {
    const result = await signInWithPopup(auth, appleProvider);
    // Get the ID token
    const idToken = await result.user.getIdToken();
    return idToken;
  } catch (error: any) {
    console.error("Apple sign-in error:", error);
    throw new Error(error?.message || "Failed to sign in with Apple");
  }
}

// Phone authentication
let recaptchaVerifier: RecaptchaVerifier | null = null;
let confirmationResult: ConfirmationResult | null = null;

export function initRecaptcha(elementId: string): boolean {
  if (!auth) {
    console.warn("Firebase authentication is not initialized");
    return false;
  }
  
  try {
    if (!recaptchaVerifier) {
      recaptchaVerifier = new RecaptchaVerifier(auth, elementId, {
        size: 'invisible',
        callback: () => {
          // reCAPTCHA solved, allow signInWithPhoneNumber.
          console.log("reCAPTCHA verified");
        }
      });
    }
    return true;
  } catch (error: any) {
    console.error("Failed to initialize reCAPTCHA:", error);
    return false;
  }
}

export async function sendPhoneVerificationCode(phoneNumber: string): Promise<boolean> {
  if (!auth) {
    throw new Error("Firebase authentication is not initialized");
  }
  
  if (!recaptchaVerifier) {
    throw new Error("reCAPTCHA not initialized");
  }
  
  try {
    confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier);
    return true;
  } catch (error: any) {
    console.error("Phone verification error:", error);
    throw new Error(error?.message || "Failed to send verification code");
  }
}

export async function verifyPhoneCode(verificationCode: string): Promise<string> {
  if (!confirmationResult) {
    throw new Error("No verification was sent");
  }
  
  try {
    const result = await confirmationResult.confirm(verificationCode);
    // Get the ID token
    const idToken = await result.user.getIdToken();
    return idToken;
  } catch (error: any) {
    console.error("Code verification error:", error);
    throw new Error(error?.message || "Invalid verification code");
  }
}

// Check if Firebase Auth is properly configured
export function isFirebaseConfigured(): boolean {
  return !!(app && auth && firebaseConfig.apiKey && 
            firebaseConfig.projectId && 
            firebaseConfig.appId);
}