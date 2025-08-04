import { useState } from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import { ChevronDown, Globe } from 'lucide-react';

const LanguageSwitcher = () => {
  const { language, setLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  const languages = [
    { code: 'id', name: 'Indonesia', flag: '🇮🇩', shortName: 'ID' },
    { code: 'en', name: 'English', flag: '🇺🇸', shortName: 'EN' },
    { code: 'ja', name: '日本語', flag: '🇯🇵', shortName: 'JP' },
    { code: 'vi', name: 'Tiếng Việt', flag: '🇻🇳', shortName: 'VI' },
  ];

  const currentLanguage = languages.find(lang => lang.code === language);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-1 px-3 py-2 text-sm font-medium text-gray-700 hover:text-primary hover:bg-gray-50 rounded-md transition-colors duration-200 border border-gray-200 hover:border-gray-300"
        aria-label="Language selector"
      >
        <Globe className="w-4 h-4" />
        <span className="hidden sm:inline">{currentLanguage?.shortName}</span>
        <span className="sm:hidden text-base">{currentLanguage?.flag}</span>
        <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${
          isOpen ? 'rotate-180' : ''
        }`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-1">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => {
                setLanguage(lang.code as 'id' | 'en' | 'ja' | 'vi');
                setIsOpen(false);
              }}
              className={`w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center space-x-3 transition-colors duration-200 ${
                language === lang.code ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'
              }`}
            >
              <span className="text-lg">{lang.flag}</span>
              <div className="flex flex-col">
                <span className="text-sm font-medium">{lang.name}</span>
                <span className="text-xs text-gray-500">{lang.shortName}</span>
              </div>
              {language === lang.code && (
                <div className="ml-auto w-2 h-2 bg-blue-500 rounded-full"></div>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Click outside to close */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default LanguageSwitcher;