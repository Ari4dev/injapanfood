import { useEffect, useState } from 'react';
import { User, onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/config/firebase';
import { hasAdminPermission, logSecurityEvent } from '@/utils/security';

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  role?: string;
  isAdmin: boolean;
  lastLoginAt?: Date;
  loginAttempts?: number;
  accountLocked?: boolean;
}

export const useSecureAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          // Log successful authentication
          logSecurityEvent('USER_AUTHENTICATED', {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            loginTime: new Date().toISOString()
          }, firebaseUser.uid);

          // Fetch user profile from Firestore
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          const userData = userDoc.data();

          // Check if account is locked
          if (userData?.accountLocked) {
            logSecurityEvent('BLOCKED_LOGIN_ATTEMPT', {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              reason: 'Account locked'
            }, firebaseUser.uid);
            
            await signOut(auth);
            setError('Account is locked. Please contact support.');
            setUser(null);
            setUserProfile(null);
            setLoading(false);
            return;
          }

          const profile: UserProfile = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            role: userData?.role || 'user',
            isAdmin: hasAdminPermission(firebaseUser.email || '', userData?.role),
            lastLoginAt: userData?.lastLoginAt?.toDate(),
            loginAttempts: userData?.loginAttempts || 0,
            accountLocked: userData?.accountLocked || false
          };

          setUser(firebaseUser);
          setUserProfile(profile);
          setError(null);

          // Update last login time
          try {
            const userRef = doc(db, 'users', firebaseUser.uid);
            await getDoc(userRef); // Just to verify document exists
            // In a real app, you'd update lastLoginAt here
          } catch (updateError) {
            console.warn('Failed to update last login time:', updateError);
          }

        } else {
          // User is signed out
          setUser(null);
          setUserProfile(null);
          setError(null);
        }
      } catch (authError) {
        console.error('Authentication error:', authError);
        logSecurityEvent('AUTHENTICATION_ERROR', {
          error: authError instanceof Error ? authError.message : 'Unknown error',
          stack: authError instanceof Error ? authError.stack : undefined
        });
        
        setError('Authentication failed. Please try again.');
        setUser(null);
        setUserProfile(null);
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const secureSignOut = async () => {
    try {
      if (user) {
        logSecurityEvent('USER_SIGNED_OUT', {
          uid: user.uid,
          email: user.email,
          signOutTime: new Date().toISOString()
        }, user.uid);
      }

      await signOut(auth);
      
      // Clear sensitive data from localStorage
      localStorage.removeItem('userPreferences');
      localStorage.removeItem('cartItems');
      
      // Clear session storage
      sessionStorage.clear();
      
      setUser(null);
      setUserProfile(null);
      setError(null);
    } catch (signOutError) {
      console.error('Sign out error:', signOutError);
      logSecurityEvent('SIGN_OUT_ERROR', {
        error: signOutError instanceof Error ? signOutError.message : 'Unknown error'
      }, user?.uid);
      throw signOutError;
    }
  };

  const checkAuthPermission = (requiredRole: 'user' | 'admin' = 'user'): boolean => {
    if (!userProfile) return false;
    
    if (requiredRole === 'admin') {
      return userProfile.isAdmin;
    }
    
    return true; // All authenticated users can access 'user' level
  };

  const requireAuth = (requiredRole: 'user' | 'admin' = 'user'): boolean => {
    if (loading) return false;
    
    if (!user || !userProfile) {
      logSecurityEvent('UNAUTHORIZED_ACCESS_ATTEMPT', {
        requiredRole,
        hasUser: !!user,
        hasProfile: !!userProfile,
        url: window.location.href
      });
      return false;
    }

    if (!checkAuthPermission(requiredRole)) {
      logSecurityEvent('INSUFFICIENT_PERMISSIONS', {
        requiredRole,
        userRole: userProfile.role,
        isAdmin: userProfile.isAdmin,
        url: window.location.href
      }, user.uid);
      return false;
    }

    return true;
  };

  // Session timeout check
  useEffect(() => {
    if (!user) return;

    const checkSessionTimeout = () => {
      const lastActivity = localStorage.getItem('lastActivity');
      if (lastActivity) {
        const timeSinceLastActivity = Date.now() - parseInt(lastActivity);
        const sessionTimeout = 24 * 60 * 60 * 1000; // 24 hours

        if (timeSinceLastActivity > sessionTimeout) {
          logSecurityEvent('SESSION_TIMEOUT', {
            uid: user.uid,
            timeSinceLastActivity: timeSinceLastActivity / 1000 / 60, // minutes
            sessionTimeout: sessionTimeout / 1000 / 60 // minutes
          }, user.uid);
          
          secureSignOut();
        }
      }
      
      // Update last activity
      localStorage.setItem('lastActivity', Date.now().toString());
    };

    // Check immediately
    checkSessionTimeout();

    // Check every 5 minutes
    const interval = setInterval(checkSessionTimeout, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [user]);

  // Activity tracking for session management
  useEffect(() => {
    const updateActivity = () => {
      localStorage.setItem('lastActivity', Date.now().toString());
    };

    // Track user activity
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(event => {
      document.addEventListener(event, updateActivity, true);
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, updateActivity, true);
      });
    };
  }, []);

  return {
    user,
    userProfile,
    loading,
    error,
    isAuthenticated: !!user && !!userProfile,
    isAdmin: userProfile?.isAdmin || false,
    secureSignOut,
    checkAuthPermission,
    requireAuth,
    clearError: () => setError(null)
  };
};
