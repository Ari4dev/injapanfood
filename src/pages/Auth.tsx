import AuthForm from '@/components/AuthForm';
import { useAuth } from '@/hooks/useFirebaseAuth';
import { useEffect } from 'react';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { Navigate } from 'react-router-dom';
import { processReferralCode } from '@/utils/referralUtils';

const Auth = () => {
  const { user } = useAuth();
  const db = getFirestore();
  
  // Process referral code from URL if present
  useEffect(() => {
    processReferralCode();
  }, []);
  
  // Ensure user profile is created in Firestore
  useEffect(() => {
    if (user) {
      const ensureUserProfile = async () => {
        try {
          const adminEmails = ['admin@gmail.com', 'ari4rich@gmail.com', 'newadmin@gmail.com', 'injpn@food.com', 'admin2@gmail.com'];
          const role = adminEmails.includes(user.email || '') ? 'admin' : 'user';
          
          const userRef = doc(db, 'users', user.uid);
          
          // Get additional user data from localStorage if available (from recent signup)
          const phoneNumber = localStorage.getItem('userPhoneNumber');
          const gender = localStorage.getItem('userGender');
          
          await setDoc(userRef, {
            uid: user.uid,
            email: user.email || '',
            displayName: user.displayName || user.email?.split('@')[0] || '',
            phoneNumber: phoneNumber || '',
            gender: gender || '',
            role: role,
            createdAt: new Date().toISOString(),
            lastLogin: new Date().toISOString(),
            isOnline: true
          }, { merge: true });
          
          // Clear temporary data from localStorage
          localStorage.removeItem('userPhoneNumber');
          localStorage.removeItem('userGender');
          
          console.log('User profile ensured in Firestore:', user.email);
        } catch (error) {
          console.error('Error ensuring user profile:', error);
        }
      };

      ensureUserProfile();
    }
  }, [user, db]);
  
  // Only show auth form if no user, otherwise redirect to home
  if (user) {
    return <Navigate to="/" replace />;
  }
  
  return <AuthForm />;
};

export default Auth;