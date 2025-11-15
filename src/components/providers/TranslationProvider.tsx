'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import enMessages from '@/locales/en.json';
import frMessages from '@/locales/fr.json';

type Locale = 'en' | 'fr';
type Messages = typeof enMessages;

interface TranslationContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  messages: Messages;
  t: (key: string) => string;
}

const TranslationContext = createContext<TranslationContextType | undefined>(undefined);

const messagesMap = {
  en: enMessages,
  fr: frMessages,
};

export function TranslationProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en');
  const [messages, setMessages] = useState<Messages>(enMessages);

  useEffect(() => {
    // Get locale from localStorage on mount
    const storedLocale = localStorage.getItem('locale') as Locale;
    if (storedLocale && (storedLocale === 'en' || storedLocale === 'fr')) {
      setLocaleState(storedLocale);
      setMessages(messagesMap[storedLocale]);
    }
  }, []);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    setMessages(messagesMap[newLocale]);
    localStorage.setItem('locale', newLocale);
    
    // Dispatch event for other components
    window.dispatchEvent(new CustomEvent('localeChange', { detail: newLocale }));
  };

  const t = (key: string): string => {
    const keys = key.split('.');
    let value: any = messages;
    
    for (const k of keys) {
      value = value?.[k];
    }
    
    return typeof value === 'string' ? value : key;
  };

  return (
    <TranslationContext.Provider value={{ locale, setLocale, messages, t }}>
      {children}
    </TranslationContext.Provider>
  );
}

export function useTranslations(namespace?: string) {
  const context = useContext(TranslationContext);
  if (!context) {
    throw new Error('useTranslations must be used within TranslationProvider');
  }

  return (key: string) => {
    const fullKey = namespace ? `${namespace}.${key}` : key;
    return context.t(fullKey);
  };
}

export function useLocale() {
  const context = useContext(TranslationContext);
  if (!context) {
    throw new Error('useLocale must be used within TranslationProvider');
  }
  return { locale: context.locale, setLocale: context.setLocale };
}
