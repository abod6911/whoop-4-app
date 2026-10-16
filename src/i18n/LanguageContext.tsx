import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { translations, type Language, type TranslationKey } from './translations';
import { storageService } from '../services/StorageService';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey) => string;
  isRtl: boolean;
  dir: 'rtl' | 'ltr';
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
    return 'ar'; // Default to Arabic as requested by user
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

  const isRtl = language === 'ar';
  const dir = isRtl ? 'rtl' : 'ltr';

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.dir = dir;
      document.documentElement.lang = language;
      if (isRtl) {
        document.body.classList.add('rtl-mode');
      } else {
        document.body.classList.remove('rtl-mode');
      }
    }
  }, [language, dir, isRtl]);

  const t = useCallback(
    (key: TranslationKey): string => {
      const dict = translations[language] || translations.en;
      return dict[key] || translations.en[key] || String(key);
    },
    [language]
  );

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, isRtl, dir }}>
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
