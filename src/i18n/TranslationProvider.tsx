import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Language } from './translations';
import { translations } from './translations';
import { SettingsDB } from '../db/database';

interface TranslationContextType {
  t: (key: string) => string;
  lang: Language;
  setLang: (lang: Language) => void;
}

const TranslationContext = createContext<TranslationContextType>({
  t: (key: string) => key,
  lang: 'en',
  setLang: () => {},
});

export function useTranslation() {
  return useContext(TranslationContext);
}

export const TranslationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<Language>('en');
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    SettingsDB.get().then((settings) => {
      const l = settings.language as Language;
      if (l && ['en', 'ta', 'hi'].includes(l)) {
        setLangState(l);
      }
      setInitialized(true);
    }).catch(() => setInitialized(true));
  }, []);

  const t = useCallback((key: string): string => {
    const entry = translations[key];
    if (!entry) return key;
    return entry[lang] || entry.en;
  }, [lang]);

  const setLang = useCallback((newLang: Language) => {
    setLangState(newLang);
    SettingsDB.save({ language: newLang }).catch(() => {});
  }, []);

  // Don't render children until lang is loaded from DB
  if (!initialized) return null;

  return (
    <TranslationContext.Provider value={{ t, lang, setLang }}>
      {children}
    </TranslationContext.Provider>
  );
};
