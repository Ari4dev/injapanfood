import { securityConfig } from '@/config/env';

// Input validation utilities
export const validateInput = {
  email: (email: string): boolean => {
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    return emailRegex.test(email) && email.length <= 254 && email.length >= 5;
  },
  
  phone: (phone: string): boolean => {
    // Indonesian phone number validation
    const cleanPhone = phone.replace(/[\s\-()]/g, '');
    const phoneRegex = /^(\+62|62|0)8[1-9][0-9]{6,9}$/;
    return phoneRegex.test(cleanPhone);
  },
  
  password: (password: string): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    if (password.length < 8) errors.push('Password must be at least 8 characters long');
    if (!/[a-z]/.test(password)) errors.push('Password must contain lowercase letters');
    if (!/[A-Z]/.test(password)) errors.push('Password must contain uppercase letters');
    if (!/[0-9]/.test(password)) errors.push('Password must contain numbers');
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) errors.push('Password must contain special characters');
    
    return { isValid: errors.length === 0, errors };
  },
  
  postalCode: (postalCode: string): boolean => {
    // Japanese postal code format: 123-4567
    const postalRegex = /^\d{3}-\d{4}$/;
    return postalRegex.test(postalCode);
  },
  
  name: (name: string): boolean => {
    const nameRegex = /^[a-zA-Z\s\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF\u0100-\u017F\u1EA0-\u1EF9]+$/;
    return nameRegex.test(name) && name.length >= 2 && name.length <= 50;
  },
  
  price: (price: number): boolean => {
    return typeof price === 'number' && price >= 0 && price <= 1000000;
  },
  
  quantity: (quantity: number): boolean => {
    return Number.isInteger(quantity) && quantity > 0 && quantity <= 1000;
  },
  
  text: (text: string, maxLength: number = 1000): boolean => {
    return typeof text === 'string' && text.length <= maxLength && !containsXSS(text);
  }
};

// XSS prevention
export const containsXSS = (input: string): boolean => {
  const xssPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<iframe/gi,
    /<object/gi,
    /<embed/gi
  ];
  
  return xssPatterns.some(pattern => pattern.test(input));
};

// Sanitize user input
export const sanitizeInput = (input: string): string => {
  return input
    .replace(/[<>]/g, '') // Remove < and >
    .replace(/javascript:/gi, '') // Remove javascript:
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .trim();
};

// File validation
export const validateFile = (file: File): { isValid: boolean; error?: string } => {
  // Check file size
  if (file.size > securityConfig.maxFileSize) {
    return {
      isValid: false,
      error: `File size exceeds ${securityConfig.maxFileSize / (1024 * 1024)}MB limit`
    };
  }
  
  // Check file type
  if (!securityConfig.allowedImageTypes.includes(file.type)) {
    return {
      isValid: false,
      error: 'Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed'
    };
  }
  
  return { isValid: true };
};

// Rate limiting (client-side tracking)
class RateLimiter {
  private requests: number[] = [];
  
  canMakeRequest(): boolean {
    const now = Date.now();
    const oneMinuteAgo = now - 60 * 1000;
    const oneHourAgo = now - 60 * 60 * 1000;
    
    // Clean old requests
    this.requests = this.requests.filter(time => time > oneHourAgo);
    
    const recentRequests = this.requests.filter(time => time > oneMinuteAgo);
    
    // Check limits
    if (recentRequests.length >= securityConfig.maxRequestsPerMinute) {
      return false;
    }
    
    if (this.requests.length >= securityConfig.maxRequestsPerHour) {
      return false;
    }
    
    // Add current request
    this.requests.push(now);
    return true;
  }
}

export const rateLimiter = new RateLimiter();

// Admin validation
export const isAdminEmail = (email: string): boolean => {
  return securityConfig.adminEmails.includes(email.toLowerCase());
};

export const hasAdminPermission = (userEmail?: string, userRole?: string): boolean => {
  if (!userEmail) return false;
  return isAdminEmail(userEmail) || userRole === 'admin';
};

// Security logging
export const logSecurityEvent = (event: string, details: any, userId?: string) => {
  const logEntry = {
    timestamp: new Date().toISOString(),
    event,
    details,
    userId,
    userAgent: navigator.userAgent,
    url: window.location.href
  };
  
  // In production, send to logging service
  console.warn('Security Event:', logEntry);
  
  // Store locally for debugging (remove in production)
  const logs = JSON.parse(localStorage.getItem('securityLogs') || '[]');
  logs.push(logEntry);
  localStorage.setItem('securityLogs', JSON.stringify(logs.slice(-100)));
};

// Secure random string generation
export const generateSecureToken = (length: number = 32): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return result;
};

// Content Security Policy headers (for reference)
export const cspHeaders = {
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://apis.google.com https://www.gstatic.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https: blob:",
    "connect-src 'self' https://api.exchangerate-api.com https://open.er-api.com https://*.firebaseapp.com https://*.googleapis.com",
    "frame-src 'none'",
    "object-src 'none'",
    "base-uri 'self'"
  ].join('; ')
};