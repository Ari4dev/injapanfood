import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import idTranslations from '@/locales/id.json';
import enTranslations from '@/locales/en.json';
import jaTranslations from '@/locales/ja.json';
import viTranslations from '@/locales/vi.json';

type Language = 'id' | 'en' | 'ja' | 'vi';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, any>) => string;
}

const translations = {
  id: idTranslations,
  en: enTranslations,
  ja: jaTranslations,
  vi: viTranslations,
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<Language>('ja');

  useEffect(() => {
    // Detect language from multiple sources
    const detectLanguage = (): Language => {
      // 1. Check saved language in localStorage
      const savedLanguage = localStorage.getItem('language') as Language;
      if (savedLanguage && ['id', 'en', 'ja', 'vi'].includes(savedLanguage)) {
        console.log('useLanguage: Found saved language:', savedLanguage);
        return savedLanguage;
      }

      // 2. Check URL parameters (e.g., ?lang=ja)
      const urlParams = new URLSearchParams(window.location.search);
      const langParam = urlParams.get('lang') as Language;
      if (langParam && ['id', 'en', 'ja', 'vi'].includes(langParam)) {
        console.log('useLanguage: Found language in URL:', langParam);
        return langParam;
      }

      // 3. Check browser language
      const browserLang = navigator.language.toLowerCase();
      if (browserLang.startsWith('ja')) return 'ja';
      if (browserLang.startsWith('en')) return 'en';
      if (browserLang.startsWith('id')) return 'id';
      if (browserLang.startsWith('vi')) return 'vi';

      // 4. Default to Japanese (since this is a Japan-focused site)
      console.log('useLanguage: No language detected, defaulting to Japanese');
      return 'ja';
    };

    const detectedLanguage = detectLanguage();
    console.log('useLanguage: Setting language to:', detectedLanguage);
    setLanguageState(detectedLanguage);
    localStorage.setItem('language', detectedLanguage);
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('language', lang);
  };

  const t = (key: string, params?: Record<string, any>): string => {
    const keys = key.split('.');
    
    // Debug log for key translation attempts
    if (key.startsWith('profile.') || key.startsWith('common.')) {
      console.log(`useLanguage: Translating key '${key}' with language '${language}'`);
    }
    
    // Handle string interpolation with parameters
    const interpolate = (text: string, params?: Record<string, any>): string => {
      if (!params) return text;
      
      return text.replace(/{([^}]*)}/g, (match, key) => {
        const value = params[key];
        return value !== undefined ? value : match;
      });
    };
    
    // Function to get value from nested object
    const getValue = (obj: any, keys: string[]): string | null => {
      let current = obj;
      for (const key of keys) {
        if (current && typeof current === 'object' && key in current) {
          current = current[key];
        } else {
          return null;
        }
      }
      return typeof current === 'string' ? current : null;
    };
    
    // Try to get value from current language
    let value = getValue(translations[language], keys);
    
    // Debug log for translation result
    if (key.startsWith('profile.') || key.startsWith('common.')) {
      console.log(`useLanguage: Translation result for '${key}':`, value);
    }
    
    // If not found, try English as fallback (avoid Indonesian)
    if (value === null && language !== 'en') {
      value = getValue(translations.en, keys);
      if (key.startsWith('profile.') || key.startsWith('common.') || key.startsWith('affiliate.')) {
        console.log(`useLanguage: Fallback to English for '${key}':`, value);
      }
    }
    
    // If still not found, return the key itself
    if (value === null) {
      console.warn(`Translation key not found: ${key}`);
      return key;
    }
    
    // Handle parameters
    if (params) {
      return interpolate(value, params);
    }
    
    // Legacy support: Check if this is a call with parameters in the key
    const match = key.match(/^(.+),\s*(.+)$/);
    if (match) {
      try {
        const actualKey = match[1];
        const paramsStr = match[2];
        const legacyParams = JSON.parse(`{${paramsStr}}`);
        
        // Get the string again without the params part
        const baseValue = t(actualKey);
        return interpolate(baseValue, legacyParams);
      } catch (e) {
        console.error('Error parsing parameters for translation:', e);
        return value;
      }
    }
    
    return value;
  };

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = React.useMemo(() => ({
    language,
    setLanguage,
    t
  }), [language]);

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};