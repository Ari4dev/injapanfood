import { securityConfig } from '@/config/env';

// Input validation utilities
export const validateInput = {
  email: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email.length <= 254;
  },
  
  phone: (phone: string): boolean => {
    const phoneRegex = /^[+]?[\d\s\-()]{10,15}$/;
    return phoneRegex.test(phone);
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
  return securityConfig.adminEmails.includes(email);
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