import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

// Firebase config - ganti dengan config Anda
const firebaseConfig = {
  apiKey: "AIzaSyC5VsG5gJHZBZBIkYNFWHTKh7N7iV4OQ4E",
  authDomain: "injapan-food.firebaseapp.com",
  projectId: "injapan-food",
  storageBucket: "injapan-food.appspot.com",
  messagingSenderId: "323443767194",
  appId: "1:323443767194:web:8f90b8f4e1b6a4c3b8e1a4",
  measurementId: "G-KZMV6WL9V1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function initAffiliateSettings() {
  try {
    console.log('Initializing affiliate settings...');
    
    const defaultSettings = {
      defaultCommissionRate: 5,
      minPayoutAmount: 50000,
      payoutMethods: ['Bank Transfer', 'Transfer Bank Rupiah (Indonesia)'],
      termsAndConditions: 'Default terms and conditions for the affiliate program.',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Create default settings document
    await setDoc(doc(db, 'affiliate_settings', 'default'), defaultSettings);
    
    console.log('Affiliate settings initialized successfully!');
    console.log('Settings:', defaultSettings);
    
  } catch (error) {
    console.error('Error initializing affiliate settings:', error);
  }
}

initAffiliateSettings();
