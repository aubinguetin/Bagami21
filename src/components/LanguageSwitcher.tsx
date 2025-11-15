'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Check } from 'lucide-react';

const locales = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
];

export default function LanguageSwitcher() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [currentLocale, setCurrentLocale] = useState('en');

  // Get current locale from localStorage or default to 'en'
  useEffect(() => {
    const savedLocale = localStorage.getItem('locale') || 'en';
    setCurrentLocale(savedLocale);
  }, []);

  const switchLanguage = async (newLocale: string) => {
    setIsOpen(false);
    setCurrentLocale(newLocale);
    
    // Save to localStorage
    localStorage.setItem('locale', newLocale);
    
    // Dispatch custom event to notify all components
    window.dispatchEvent(new CustomEvent('localeChange', { detail: { locale: newLocale } }));
    
    // Save preference to database if user is logged in
    try {
      await fetch('/api/user/language', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language: newLocale }),
      });
    } catch (error) {
      console.error('Failed to save language preference:', error);
    }

    // Refresh the page to apply language changes
    router.refresh();
  };

  const currentLocaleData = locales.find(l => l.code === currentLocale) || locales[0];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
        aria-label="Switch language"
      >
        <span className="text-sm font-medium text-gray-700">{currentLocaleData.name}</span>
        <span className="text-lg">{currentLocaleData.flag}</span>
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
            {locales.map((loc) => (
              <button
                key={loc.code}
                onClick={() => switchLanguage(loc.code)}
                className={`w-full flex items-center justify-between px-4 py-2 hover:bg-gray-50 transition-colors ${
                  loc.code === currentLocale ? 'bg-orange-50' : ''
                }`}
              >
                <div className="flex items-center space-x-2">
                  <span className="text-lg">{loc.flag}</span>
                  <span className="text-sm font-medium text-gray-700">{loc.name}</span>
                </div>
                {loc.code === currentLocale && (
                  <Check className="w-4 h-4 text-orange-600" />
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
