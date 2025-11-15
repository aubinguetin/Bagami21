import { getRequestConfig } from 'next-intl/server';
import { headers } from 'next/headers';

// Define supported locales
export const locales = ['en', 'fr'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'en';

// This is used to get the locale from the request
export default getRequestConfig(async () => {
  // Try to get locale from various sources
  let locale: string = defaultLocale;
  
  try {
    const headersList = await headers();
    const cookieLocale = headersList.get('cookie')?.match(/NEXT_LOCALE=([^;]+)/)?.[1];
    
    if (cookieLocale && locales.includes(cookieLocale as Locale)) {
      locale = cookieLocale;
    } else {
      // Fall back to Accept-Language header
      const acceptLanguage = headersList.get('accept-language');
      if (acceptLanguage) {
        const browserLocale = getBrowserLocale(acceptLanguage);
        locale = browserLocale;
      }
    }
  } catch (error) {
    console.error('Error getting locale:', error);
  }

  return {
    locale,
    messages: (await import(`./locales/${locale}.json`)).default
  };
});

// Helper function to get user's preferred locale
export function getUserLocale(userLanguage?: string | null): Locale {
  if (userLanguage && locales.includes(userLanguage as Locale)) {
    return userLanguage as Locale;
  }
  return defaultLocale;
}

// Helper function to detect locale from browser
export function getBrowserLocale(acceptLanguage?: string): Locale {
  if (!acceptLanguage) return defaultLocale;

  // Parse Accept-Language header
  const languages = acceptLanguage
    .split(',')
    .map(lang => {
      const [locale, q = '1'] = lang.trim().split(';q=');
      return { locale: locale.toLowerCase().split('-')[0], quality: parseFloat(q) };
    })
    .sort((a, b) => b.quality - a.quality);

  // Find first supported locale
  for (const { locale } of languages) {
    if (locales.includes(locale as Locale)) {
      return locale as Locale;
    }
  }

  return defaultLocale;
}
