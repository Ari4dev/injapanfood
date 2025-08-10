/**
 * Debug utilities to help troubleshoot referral link issues
 */

export const debugReferralIssue = () => {
  console.group('🔍 Referral Link Debug Information');
  
  // Current URL information
  const currentUrl = window.location.href;
  const urlParams = new URLSearchParams(window.location.search);
  const refCode = urlParams.get('ref');
  
  console.log('Current URL:', currentUrl);
  console.log('Referral Code:', refCode);
  console.log('Full URL Parameters:', Object.fromEntries(urlParams.entries()));
  
  // Browser information
  console.log('User Agent:', navigator.userAgent);
  console.log('Is Mobile:', /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
  
  // Service Worker information
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(registrations => {
      console.log('Service Workers:', registrations.length);
      registrations.forEach((registration, index) => {
        console.log(`SW ${index + 1}:`, registration.scope);
      });
    });
  }
  
  // Cache information
  if ('caches' in window) {
    caches.keys().then(cacheNames => {
      console.log('Available Caches:', cacheNames);
    });
  }
  
  // Local/Session storage
  console.log('Local Storage Keys:', Object.keys(localStorage));
  console.log('Session Storage Keys:', Object.keys(sessionStorage));
  
  // React Query cache
  const reactQueryKeys = Object.keys(localStorage).filter(key => 
    key.startsWith('rq-') || key.startsWith('tanstack-')
  );
  console.log('React Query Cache Keys:', reactQueryKeys);
  
  console.groupEnd();
};

export const handleSESErrors = () => {
  console.log('🔒 Handling SES lockdown errors...');
  
  try {
    // Clear SES-related localStorage
    Object.keys(localStorage).forEach(key => {
      if (key.toLowerCase().includes('ses') || 
          key.toLowerCase().includes('lockdown') || 
          key.toLowerCase().includes('secure') ||
          key.toLowerCase().includes('compartment')) {
        console.log('Removing SES-related key:', key);
        localStorage.removeItem(key);
      }
    });
    
    // Clear session storage too
    Object.keys(sessionStorage).forEach(key => {
      if (key.toLowerCase().includes('ses') || 
          key.toLowerCase().includes('lockdown') || 
          key.toLowerCase().includes('secure')) {
        console.log('Removing SES-related session key:', key);
        sessionStorage.removeItem(key);
      }
    });
    
    // Disable any global SES features if they exist
    if (typeof window !== 'undefined') {
      // @ts-ignore
      if (window.lockdown) {
        console.log('Disabling SES lockdown...');
        // @ts-ignore
        window.lockdown = undefined;
      }
      
      // @ts-ignore
      if (window.SES) {
        console.log('Clearing SES references...');
        // @ts-ignore
        window.SES = undefined;
      }
    }
    
    console.log('✅ SES error handling completed');
    
  } catch (error) {
    console.error('❌ Error handling SES issues:', error);
  }
};

export const clearAllCaches = async () => {
  console.log('🧹 Clearing all caches...');
  
  // Handle SES issues first
  handleSESErrors();
  
  try {
    // Clear localStorage
    const lsKeys = Object.keys(localStorage);
    lsKeys.forEach(key => {
      if (key.startsWith('rq-') || key.startsWith('tanstack-') || key.startsWith('chakra-ui')) {
        localStorage.removeItem(key);
      }
    });
    
    // Clear sessionStorage
    const ssKeys = Object.keys(sessionStorage);
    ssKeys.forEach(key => {
      if (key.startsWith('rq-') || key.startsWith('tanstack-')) {
        sessionStorage.removeItem(key);
      }
    });
    
    // Clear cache storage
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
      );
      console.log('✅ Cache storage cleared');
    }
    
    // Clear service workers
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(
        registrations.map(registration => registration.unregister())
      );
      console.log('✅ Service workers cleared');
    }
    
    console.log('✅ All caches cleared successfully');
    
  } catch (error) {
    console.error('❌ Error clearing caches:', error);
  }
};

export const detectAbnormalElements = () => {
  console.group('🔍 Detecting abnormal DOM elements');
  
  // Look for elements with "Enter" or "List" text
  const allElements = document.querySelectorAll('*');
  const suspiciousElements: Element[] = [];
  
  allElements.forEach(element => {
    const text = element.textContent?.trim().toLowerCase();
    if (text === 'enter' || text === 'list') {
      suspiciousElements.push(element);
    }
  });
  
  if (suspiciousElements.length > 0) {
    console.log('⚠️ Found suspicious elements:', suspiciousElements);
    suspiciousElements.forEach((element, index) => {
      console.log(`Element ${index + 1}:`, {
        tag: element.tagName,
        text: element.textContent,
        classes: element.className,
        id: element.id,
        element: element
      });
    });
  } else {
    console.log('✅ No suspicious "Enter" or "List" elements found');
  }
  
  // Check for extension-injected elements
  const extensionElements = document.querySelectorAll('[data-extension], [data-adblock], [data-password-manager]');
  if (extensionElements.length > 0) {
    console.log('⚠️ Found extension-injected elements:', extensionElements);
  }
  
  console.groupEnd();
  
  return suspiciousElements;
};

// Utility to check if current page has referral issues
export const checkReferralIssues = () => {
  const urlParams = new URLSearchParams(window.location.search);
  const refCode = urlParams.get('ref');
  
  if (refCode) {
    console.log('🔗 Referral code detected, running diagnostics...');
    debugReferralIssue();
    
    // Wait a moment then check for abnormal elements
    setTimeout(() => {
      detectAbnormalElements();
    }, 1000);
  }
};
