import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { translations, type Language, type TranslationKey } from './translations';
import { storageService } from '../services/StorageService';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: string, fallback?: string) => string;
  isRtl: boolean;
  dir: 'rtl' | 'ltr';
  formatNumber: (value: number, options?: Intl.NumberFormatOptions) => string;
  formatDate: (date: Date | number | string, options?: Intl.DateTimeFormatOptions) => string;
  formatTime: (date: Date | number | string, options?: Intl.DateTimeFormatOptions) => string;
  dayNames: string[];
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const userSettings = storageService.getUserSettings();
      if (userSettings && (userSettings.language === 'ar' || userSettings.language === 'en')) {
        return userSettings.language;
      }
      const savedLang = localStorage.getItem('whoop_app_language');
      if (savedLang === 'ar' || savedLang === 'en') {
        return savedLang;
      }
    } catch {
      // Fallback
    }
    return 'ar'; // Default to Arabic
  });

  const setLanguage = useCallback((newLang: Language) => {
    setLanguageState(newLang);
    try {
      localStorage.setItem('whoop_app_language', newLang);
      const settings = storageService.getUserSettings();
      if (settings.language !== newLang) {
        storageService.saveUserSettings({
          ...settings,
          language: newLang,
        });
      }
    } catch (e) {
      console.warn('Failed saving language preference', e);
    }
  }, []);

  const toggleLanguage = useCallback(() => {
    setLanguage(language === 'ar' ? 'en' : 'ar');
  }, [language, setLanguage]);

  const isRtl = language === 'ar';
  const dir = isRtl ? 'rtl' : 'ltr';

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.dir = dir;
      document.documentElement.setAttribute('dir', dir);
      document.documentElement.lang = language;
      document.documentElement.setAttribute('lang', language);

      if (isRtl) {
        document.documentElement.classList.add('rtl-mode');
        document.body.classList.add('rtl-mode');
      } else {
        document.documentElement.classList.remove('rtl-mode');
        document.body.classList.remove('rtl-mode');
      }
    }
  }, [language, dir, isRtl]);

  const t = useCallback(
    (key: string, fallback?: string): string => {
      const langDict = translations[language];
      if (langDict && key in langDict) {
        return (langDict as unknown as Record<string, string>)[key];
      }
      const enDict = translations.en;
      if (enDict && key in enDict) {
        return (enDict as unknown as Record<string, string>)[key];
      }
      return fallback !== undefined ? fallback : key;
    },
    [language]
  );

  const formatNumber = useCallback(
    (value: number, options?: Intl.NumberFormatOptions): string => {
      try {
        const locale = isRtl ? 'ar-SA' : 'en-US';
        return new Intl.NumberFormat(locale, options).format(value);
      } catch {
        return value.toString();
      }
    },
    [isRtl]
  );

  const formatDate = useCallback(
    (date: Date | number | string, options?: Intl.DateTimeFormatOptions): string => {
      try {
        const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
        const locale = isRtl ? 'ar-SA' : 'en-US';
        return new Intl.DateTimeFormat(locale, options).format(d);
      } catch {
        return String(date);
      }
    },
    [isRtl]
  );

  const formatTime = useCallback(
    (date: Date | number | string, options?: Intl.DateTimeFormatOptions): string => {
      try {
        const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
        const locale = isRtl ? 'ar-SA' : 'en-US';
        return new Intl.DateTimeFormat(locale, {
          hour: '2-digit',
          minute: '2-digit',
          ...options,
        }).format(d);
      } catch {
        return String(date);
      }
    },
    [isRtl]
  );

  const dayNames = useMemo(() => {
    return isRtl
      ? ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت']
      : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  }, [isRtl]);

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        toggleLanguage,
        t,
        isRtl,
        dir,
        formatNumber,
        formatDate,
        formatTime,
        dayNames,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
