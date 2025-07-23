import { trackReferralClick, registerWithReferral } from '@/services/affiliateService';
import { auth } from '@/config/firebase';

// Session-based referral storage (temporary, cleared on browser close)
const SESSION_REFERRAL_KEY = 'currentSessionReferral';
const SESSION_TIMESTAMP_KEY = 'currentSessionReferralTimestamp';

// Get referral code from URL
export const getReferralCodeFromUrl = (): string | null => {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('ref');
};

// Store referral code in sessionStorage (only for current session)
export const storeReferralCode = (referralCode: string): void => {
  // Clear any old persistent referral data
  clearPersistentReferralData();
  
  // Store in sessionStorage (cleared when browser/tab closes)
  sessionStorage.setItem(SESSION_REFERRAL_KEY, referralCode);
  sessionStorage.setItem(SESSION_TIMESTAMP_KEY, Date.now().toString());
  console.log(`Stored referral code in sessionStorage for current session: ${referralCode}`);
};

// Clear persistent referral data from localStorage
const clearPersistentReferralData = (): void => {
  localStorage.removeItem('referralCode');
  localStorage.removeItem('referralTimestamp');
  localStorage.removeItem('referralUsed');
  console.log('Cleared persistent referral data from localStorage');
};

// Get stored referral code from current session only
export const getStoredReferralCode = (): string | null => {
  return sessionStorage.getItem(SESSION_REFERRAL_KEY);
};

// Check if referral code is still valid (within current session and time limit)
export const isReferralCodeValid = (): boolean => {
  const timestamp = sessionStorage.getItem(SESSION_TIMESTAMP_KEY);
  const referralCode = sessionStorage.getItem(SESSION_REFERRAL_KEY);
  
  // No referral code in current session
  if (!referralCode || !timestamp) {
    console.log('No referral code in current session');
    return false;
  }
  
  const referralDate = new Date(parseInt(timestamp));
  const now = new Date();
  
  // Calculate difference in days
  const diffTime = now.getTime() - referralDate.getTime();
  const diffDays = diffTime / (1000 * 60 * 60 * 24);
  
  // Valid for current session and within 1 day only
  const isWithinTimeLimit = diffDays <= 1;
  
  if (!isWithinTimeLimit) {
    console.log('Referral code has expired (1 day limit)');
    clearCurrentSessionReferral();
    return false;
  }
  
  return isWithinTimeLimit;
};

// Clear current session referral (after successful order)
export const clearCurrentSessionReferral = (): void => {
  sessionStorage.removeItem(SESSION_REFERRAL_KEY);
  sessionStorage.removeItem(SESSION_TIMESTAMP_KEY);
  console.log('Cleared current session referral');
};

// Clear referral code from both session and persistent storage
export const clearReferralCode = (): void => {
  clearCurrentSessionReferral();
  clearPersistentReferralData();
  console.log('Cleared all referral data');
};

// Check if user accessed via referral link in current session
export const hasActiveReferralSession = (): boolean => {
  const referralCode = getStoredReferralCode();
  const isValid = isReferralCodeValid();
  
  console.log('Checking active referral session:', { referralCode, isValid });
  return !!(referralCode && isValid);
};

// Track referral click
export const trackReferral = async (referralCode: string): Promise<void> => {
  try {
    console.log('Attempting to track referral code:', referralCode);
    // Generate a visitor ID (or use existing one)
    let visitorId = localStorage.getItem('visitorId');
    if (!visitorId) {
      visitorId = `visitor_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      localStorage.setItem('visitorId', visitorId);
    }
    
    try {
      // Track the click
      await trackReferralClick(referralCode, visitorId);
      console.log('Successfully tracked referral click');
    } catch (clickError) {
      console.warn('Non-critical error tracking referral click (continuing):', clickError);
      // Continue execution even if tracking fails
    }
    
    // Store the referral code
    storeReferralCode(referralCode);
    console.log('Referral code stored successfully:', referralCode);
    
    // If user is already logged in, register them with the referral
    const currentUser = auth.currentUser;
    if (currentUser) {
      console.log('User already logged in, registering with referral');
      try {
        await registerWithReferral(
          referralCode,
          currentUser.uid,
          currentUser.email || '',
          currentUser.displayName || currentUser.email?.split('@')[0] || 'User'
        );
        console.log('User registered with referral successfully');
      } catch (registerError) {
        console.error('Error registering logged-in user with referral:', registerError);
      }
    }
  } catch (error) {
    console.error('Error tracking referral:', error);
  }
};

// Check and process referral code from URL
export const processReferralCode = async (): Promise<void> => {
  try {
    console.log('Checking for referral code in URL');
    const referralCode = getReferralCodeFromUrl();
    
    if (referralCode) {
      console.log('Found referral code in URL:', referralCode);
      
      // Clear any existing referral data first
      clearReferralCode();
      
      try {
      // Store the referral code immediately
      storeReferralCode(referralCode);
      console.log('Stored referral code:', referralCode);
      
        await trackReferral(referralCode);
        console.log('Successfully tracked referral for code:', referralCode);
      } catch (error) {
        console.warn('Error in referral tracking, continuing with code storage:', error);
        // Code is already stored above
      }
    } else {
      console.log('No referral code found in URL');
      
      // If no referral code in URL, ensure no old referral data persists
      // Only clear persistent data, keep session data if user is in middle of session
      const hasActiveSession = hasActiveReferralSession();
      if (!hasActiveSession) {
        clearReferralCode();
        console.log('No active referral session, cleared any old referral data');
      }
    }
  } catch (error) {
    console.error('Error processing referral code:', error);
    // Don't rethrow to prevent app from crashing
  }
};

// Redirect to auth page with referral code
export const redirectToAuthWithReferral = (referralCode: string): void => {
  window.location.href = `/auth?tab=signup&ref=${referralCode}`;
};