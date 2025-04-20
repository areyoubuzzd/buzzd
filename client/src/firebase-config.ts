/**
 * Firebase configuration file
 * This file initializes Firebase with the provided configuration values
 */

export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebasestorage.app`,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// For testing purposes only - will be removed in production
export function checkFirebaseConfig() {
  console.log("Checking Firebase configuration...");
  console.log("API Key available:", !!import.meta.env.VITE_FIREBASE_API_KEY);
  console.log("Project ID available:", !!import.meta.env.VITE_FIREBASE_PROJECT_ID);
  console.log("App ID available:", !!import.meta.env.VITE_FIREBASE_APP_ID);
  
  return {
    hasApiKey: !!import.meta.env.VITE_FIREBASE_API_KEY,
    hasProjectId: !!import.meta.env.VITE_FIREBASE_PROJECT_ID,
    hasAppId: !!import.meta.env.VITE_FIREBASE_APP_ID,
    isComplete: !!import.meta.env.VITE_FIREBASE_API_KEY && !!import.meta.env.VITE_FIREBASE_PROJECT_ID && !!import.meta.env.VITE_FIREBASE_APP_ID
  };
}