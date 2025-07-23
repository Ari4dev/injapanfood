
// Firebase configuration from environment variables
export const firebaseConfig = {
  apiKey: "AIzaSyCwaM057q4UhhSg_Aok4nSh9HWYptJfm5Q",
  authDomain: "injapan-food.firebaseapp.com",
  projectId: "injapan-food",
  storageBucket: "injapan-food.firebasestorage.app",
  messagingSenderId: "323443767194",
  appId: "1:323443767194:web:a5638c2cf89c9c8106ac23"
};

// Security configuration
export const securityConfig = {
  // Rate limiting
  maxRequestsPerMinute: 60,
  maxRequestsPerHour: 1000,
  
  // File upload limits
  maxFileSize: 5 * 1024 * 1024, // 5MB
  allowedImageTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  
  // Admin emails (should be moved to environment variables in production)
  adminEmails: [
    'admin@gmail.com',
    'ari4rich@gmail.com', 
    'newadmin@gmail.com',
    'injpn@food.com',
    'admin2@gmail.com'
  ]
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
