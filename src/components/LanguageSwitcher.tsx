import { useState, useEffect } from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import { ChevronDown, Globe } from 'lucide-react';

const LanguageSwitcher = () => {
  const { language, setLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const languages = [
    { code: 'id', name: 'Indonesia', flag: '🇮🇩', shortName: 'ID' },
    { code: 'en', name: 'English', flag: '🇺🇸', shortName: 'EN' },
    { code: 'ja', name: '日本語', flag: '🇯🇵', shortName: 'JP' },
    { code: 'vi', name: 'Tiếng Việt', flag: '🇻🇳', shortName: 'VI' },
  ];

  const currentLanguage = languages.find(lang => lang.code === language);

  // Check if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-1 px-3 py-2 text-sm font-medium text-gray-700 hover:text-primary hover:bg-gray-50 rounded-md transition-colors duration-200 border border-gray-200 hover:border-gray-300 touch-manipulation"
        aria-label="Language selector"
        style={{
          WebkitTapHighlightColor: 'transparent',
          touchAction: 'manipulation'
        }}
      >
        <Globe className="w-4 h-4" />
        <span className="hidden sm:inline">{currentLanguage?.shortName}</span>
        <span className="sm:hidden text-base">{currentLanguage?.flag}</span>
        <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${
          isOpen ? 'rotate-180' : ''
        }`} />
      </button>

      {isOpen && (
        <div className={`${
          isMobile 
            ? 'fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 max-w-[90vw] max-h-[80vh] rounded-lg mobile-dropdown-centered'
            : 'absolute right-0 mt-1 w-48 rounded-lg'
        } bg-white border border-gray-200 shadow-xl z-[9999] overflow-hidden`}>
          {isMobile && (
            <div className="px-6 py-3 border-b border-gray-100 bg-gray-50/50">
              <h3 className="text-sm font-medium text-gray-800 text-center">Select Language</h3>
            </div>
          )}
          {languages.map((lang, index) => (
            <button
              key={lang.code}
              onClick={() => {
                setLanguage(lang.code as 'id' | 'en' | 'ja' | 'vi');
                setIsOpen(false);
              }}
              className={`w-full ${
                isMobile ? 'px-6 py-4' : 'px-4 py-3'
              } text-left hover:bg-gray-50 flex items-center space-x-3 transition-colors duration-200 touch-manipulation ${
                language === lang.code ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'
              } ${
                isMobile && index === languages.length - 1 ? 'pb-6' : ''
              } ${
                isMobile && index < languages.length - 1 ? 'border-b border-gray-100' : ''
              }`}
              style={{
                WebkitTapHighlightColor: 'transparent',
                touchAction: 'manipulation',
                minHeight: '48px'
              }}
            >
              <span className={`${isMobile ? 'text-xl' : 'text-lg'}`}>{lang.flag}</span>
              <div className="flex flex-col">
                <span className={`${isMobile ? 'text-base' : 'text-sm'} font-medium`}>{lang.name}</span>
                <span className={`${isMobile ? 'text-sm' : 'text-xs'} text-gray-500`}>{lang.shortName}</span>
              </div>
              {language === lang.code && (
                <div className="ml-auto w-3 h-3 bg-blue-500 rounded-full"></div>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Click outside to close */}
      {isOpen && (
        <div
          className={`fixed inset-0 z-[9998] ${
            isMobile ? 'mobile-dropdown-backdrop' : ''
          }`}
          onClick={() => setIsOpen(false)}
          style={{ touchAction: 'manipulation' }}
        />
      )}
    </div>
  );
};

export default LanguageSwitcher;