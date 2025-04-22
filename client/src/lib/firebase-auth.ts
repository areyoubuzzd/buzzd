import { initializeApp } from "firebase/app";
import {
  getAuth,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  OAuthProvider,
  type Auth,
  type UserCredential,
} from "firebase/auth";
import { firebaseConfig } from "../firebase-config";
import axios from "axios";

// Firebase setup
let auth: Auth | null = null;
let app: any = null;

try {
  if (
    firebaseConfig.apiKey &&
    firebaseConfig.projectId &&
    firebaseConfig.appId
  ) {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    console.log("✅ Firebase initialized");
  } else {
    console.warn("⚠️ Firebase config incomplete");
  }
} catch (error) {
  console.error("Firebase init error:", error);
}

// === Google Redirect Sign-in ===
const googleProvider = new GoogleAuthProvider();

export function signInWithGoogleRedirect(): void {
  if (!auth) throw new Error("Firebase not initialized");
  signInWithRedirect(auth, googleProvider);
}

// === Get Google Redirect Result ===
export async function handleGoogleRedirectResult(): Promise<any> {
  if (!auth) return null;

  try {
    const result = await getRedirectResult(auth);
    if (!result?.user) return null;

    const idToken = await result.user.getIdToken();
    const payload = {
      idToken,
      authProvider: "google",
      email: result.user.email,
      displayName: result.user.displayName,
      photoUrl: result.user.photoURL,
      authProviderId: result.user.uid,
    };

    const response = await axios.post("/api/auth/google", payload);
    return response.data;
  } catch (error) {
    console.error("Google redirect result error:", error);
    throw error;
  }
}
