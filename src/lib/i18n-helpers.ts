import { useState, useEffect } from 'react';
import enTranslations from '@/locales/en.json';
import frTranslations from '@/locales/fr.json';

type TranslationKey = string;
type Translations = typeof enTranslations;

// Simple translation hook that reads from localStorage
export function useTranslations(namespace?: string) {
  const [translations, setTranslations] = useState<any>(enTranslations);

  useEffect(() => {
    const savedLocale = localStorage.getItem('locale') || 'en';
    setTranslations(savedLocale === 'fr' ? frTranslations : enTranslations);

    const handleLocaleChange = (event: CustomEvent) => {
      setTranslations(event.detail.locale === 'fr' ? frTranslations : enTranslations);
    };

    const handleStorageChange = () => {
      const newLocale = localStorage.getItem('locale') || 'en';
      setTranslations(newLocale === 'fr' ? frTranslations : enTranslations);
    };

    window.addEventListener('localeChange', handleLocaleChange as EventListener);
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('localeChange', handleLocaleChange as EventListener);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const t = (key: TranslationKey): string => {
    const keys = key.split('.');
    let value: any = namespace ? (translations as any)[namespace] : translations;
    
    for (const k of keys) {
      value = value?.[k];
      if (value === undefined) return key;
    }
    
    return typeof value === 'string' ? value : key;
  };

  return t;
}

// Hook to get current locale
export function useLocale() {
  const [locale, setLocale] = useState('en');

  useEffect(() => {
    const savedLocale = localStorage.getItem('locale') || 'en';
    setLocale(savedLocale);

    const handleLocaleChange = (event: CustomEvent) => {
      setLocale(event.detail.locale || 'en');
    };

    const handleStorageChange = () => {
      const newLocale = localStorage.getItem('locale') || 'en';
      setLocale(newLocale);
    };

    window.addEventListener('localeChange', handleLocaleChange as EventListener);
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('localeChange', handleLocaleChange as EventListener);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  return locale;
}

// Type-safe translation hook
export function useT() {
  return {
    common: useTranslations('common'),
    auth: useTranslations('auth'),
    authPage: useTranslations('authPage'),
    validation: useTranslations('validation'),
    settings: useTranslations('settings'),
    termsAndPolicy: useTranslations('termsAndPolicy'),
    profile: useTranslations('profile'),
    myDeliveries: useTranslations('myDeliveries'),
    newRequest: useTranslations('newRequest'),
    newOffer: useTranslations('newOffer'),
    postModal: useTranslations('postModal'),
    deliveries: useTranslations('deliveries'),
    alertModal: useTranslations('alertModal'),
    postTypeModal: useTranslations('postTypeModal'),
    editRequest: useTranslations('editRequest'),
    editOffer: useTranslations('editOffer'),
    deliveryDetail: useTranslations('deliveryDetail'),
    messages: useTranslations('messages'),
    chat: useTranslations('chat'),
    payment: useTranslations('payment'),
    insufficientBalance: useTranslations('insufficientBalance'),
    directPayment: useTranslations('directPayment'),
    notifications: useTranslations('notifications'),
    alertsPage: useTranslations('alertsPage'),
    reviewsPage: useTranslations('reviewsPage'),
    walletPage: useTranslations('walletPage'),
    contact: useTranslations('contact'),
    downloadPage: useTranslations('downloadPage'),
  };
}

// Helper function to format relative time
export function formatRelativeTime(date: Date, locale: string = 'en'): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });

  if (diffInSeconds < 60) {
    return rtf.format(-diffInSeconds, 'second');
  } else if (diffInSeconds < 3600) {
    return rtf.format(-Math.floor(diffInSeconds / 60), 'minute');
  } else if (diffInSeconds < 86400) {
    return rtf.format(-Math.floor(diffInSeconds / 3600), 'hour');
  } else if (diffInSeconds < 604800) {
    return rtf.format(-Math.floor(diffInSeconds / 86400), 'day');
  } else if (diffInSeconds < 2592000) {
    return rtf.format(-Math.floor(diffInSeconds / 604800), 'week');
  } else if (diffInSeconds < 31536000) {
    return rtf.format(-Math.floor(diffInSeconds / 2592000), 'month');
  } else {
    return rtf.format(-Math.floor(diffInSeconds / 31536000), 'year');
  }
}

// Helper function to format currency
export function formatCurrency(amount: number, currency: string = 'XAF', locale: string = 'en'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
  }).format(amount);
}

// Helper function to format date
export function formatDate(date: Date, locale: string = 'en', options?: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat(locale, options || {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

// Helper function to format date and time
export function formatDateTime(date: Date, locale: string = 'en'): string {
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

// Helper function to translate item types in delivery titles
export function translateItemType(itemType: string, locale: string = 'en'): string {
  const translations = locale === 'fr' ? frTranslations : enTranslations;
  const itemTypes = (translations as any).postModal?.itemDetails?.itemTypes;
  
  if (!itemTypes) return itemType;
  
  // Map lowercase item type to translation
  const typeKey = itemType.toLowerCase();
  return itemTypes[typeKey] || itemType;
}

// Helper function to translate delivery titles (replaces item types and common terms)
export function translateDeliveryTitle(title: string, locale: string = 'en'): string {
  if (!title || locale === 'en') return title;
  
  let translatedTitle = title;
  
  // Only translate if locale is French
  if (locale === 'fr') {
    // First, replace item types
    const itemTypes = ['documents', 'electronics', 'clothing', 'food', 'gifts', 'other'];
    itemTypes.forEach(type => {
      const regex = new RegExp(`\\b${type}\\b`, 'gi');
      if (regex.test(translatedTitle)) {
        const translated = translateItemType(type, locale);
        translatedTitle = translatedTitle.replace(regex, translated);
      }
    });
    
    // Replace common delivery terms
    // For delivery requests, use "pour :" pattern and remove "delivery"
    // Match patterns like "Space request: Vêtements delivery" or "Space request: food delivery"
    translatedTitle = translatedTitle
      .replace(/\bSpace request:\s*(.+?)\s+delivery\b/gi, 'Demande d\'espace pour : $1')
      .replace(/\bDelivery request:\s*(.+?)\s+delivery\b/gi, 'Demande de livraison pour : $1')
      // For offers, use "à" instead of "to"
      .replace(/\bSpace offer:/gi, 'Offre d\'espace :')
      .replace(/\s+to\s+/gi, ' à ')
      // Handle remaining patterns
      .replace(/\bSpace request:/gi, 'Demande d\'espace :')
      .replace(/\bDelivery request:/gi, 'Demande de livraison :')
      .replace(/\bdelivery\b/gi, 'livraison');
  }
  
  return translatedTitle;
}
