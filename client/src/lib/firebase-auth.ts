import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  OAuthProvider,
  signInWithPhoneNumber,
  RecaptchaVerifier 
} from "firebase/auth";
import { firebaseConfig } from "../firebase-config";

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Google authentication
const googleProvider = new GoogleAuthProvider();

export async function signInWithGoogle(): Promise<string> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    // Get the ID token
    const idToken = await result.user.getIdToken();
    return idToken;
  } catch (error) {
    console.error("Google sign-in error:", error);
    throw new Error(error.message || "Failed to sign in with Google");
  }
}

// Apple authentication
const appleProvider = new OAuthProvider('apple.com');

export async function signInWithApple(): Promise<string> {
  try {
    const result = await signInWithPopup(auth, appleProvider);
    // Get the ID token
    const idToken = await result.user.getIdToken();
    return idToken;
  } catch (error) {
    console.error("Apple sign-in error:", error);
    throw new Error(error.message || "Failed to sign in with Apple");
  }
}

// Phone authentication
let recaptchaVerifier: RecaptchaVerifier | null = null;
let confirmationResult: any = null;

export function initRecaptcha(elementId: string) {
  if (!recaptchaVerifier) {
    recaptchaVerifier = new RecaptchaVerifier(auth, elementId, {
      size: 'invisible',
      callback: () => {
        // reCAPTCHA solved, allow signInWithPhoneNumber.
      }
    });
  }
}

export async function sendPhoneVerificationCode(phoneNumber: string): Promise<boolean> {
  try {
    if (!recaptchaVerifier) {
      throw new Error("reCAPTCHA not initialized");
    }
    
    confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier);
    return true;
  } catch (error) {
    console.error("Phone verification error:", error);
    throw new Error(error.message || "Failed to send verification code");
  }
}

export async function verifyPhoneCode(verificationCode: string): Promise<string> {
  try {
    if (!confirmationResult) {
      throw new Error("No verification was sent");
    }
    
    const result = await confirmationResult.confirm(verificationCode);
    // Get the ID token
    const idToken = await result.user.getIdToken();
    return idToken;
  } catch (error) {
    console.error("Code verification error:", error);
    throw new Error(error.message || "Invalid verification code");
  }
}

// Check if Firebase Auth is properly configured
export function isFirebaseConfigured(): boolean {
  return !!firebaseConfig.apiKey && 
         !!firebaseConfig.projectId && 
         !!firebaseConfig.appId;
}