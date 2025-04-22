/**
 * Global application configuration
 * This ensures API requests are made to the correct endpoint
 * regardless of deployment environment
 */

// For deployed environments, use relative URLs
// This ensures requests go to the same origin/domain
const API_BASE_URL = '';

// Export configuration object
export const config = {
  apiBaseUrl: API_BASE_URL,
  firebase: {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  }
};