
// Firebase configuration from environment variables
export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Security configuration
export const securityConfig = {
  // Rate limiting
  maxRequestsPerMinute: 60,
  maxRequestsPerHour: 1000,
  
  // File upload limits
  maxFileSize: 5 * 1024 * 1024, // 5MB
  allowedImageTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  
  // Admin emails from environment variables
  adminEmails: import.meta.env.VITE_ADMIN_EMAILS?.split(',').map((email: string) => email.trim()) || []
};

// Enhanced configuration logging for debugging
console.log('Firebase config loaded:', {
  projectId: firebaseConfig.projectId,
  authDomain: firebaseConfig.authDomain,
  hasApiKey: !!firebaseConfig.apiKey,
  environment: window.location.hostname.includes('localhost') ? 'development' :
               window.location.hostname.includes('vercel.app') ? 'production-vercel' :
               window.location.hostname.includes('lovable.app') ? 'lovable-preview' : 'unknown',
  timestamp: new Date().toISOString()
});
