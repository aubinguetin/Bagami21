'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Get locale from localStorage
    const savedLocale = localStorage.getItem('locale');
    
    if (savedLocale && (savedLocale === 'en' || savedLocale === 'fr')) {
      // Set cookie for server-side locale detection
      document.cookie = `NEXT_LOCALE=${savedLocale}; path=/; max-age=31536000`;
      
      // Trigger a refresh if locale changed
      const currentCookie = document.cookie.match(/NEXT_LOCALE=([^;]+)/)?.[1];
      if (currentCookie !== savedLocale) {
        router.refresh();
      }
    }

    // Listen for locale changes
    const handleLocaleChange = (event: CustomEvent) => {
      const newLocale = event.detail.locale;
      if (newLocale === 'en' || newLocale === 'fr') {
        document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000`;
        localStorage.setItem('locale', newLocale);
        router.refresh();
      }
    };

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'locale' && event.newValue) {
        const newLocale = event.newValue;
        if (newLocale === 'en' || newLocale === 'fr') {
          document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000`;
          router.refresh();
        }
      }
    };

    window.addEventListener('localeChange', handleLocaleChange as EventListener);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('localeChange', handleLocaleChange as EventListener);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [router, pathname]);

  return <>{children}</>;
}
