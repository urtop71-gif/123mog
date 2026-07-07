"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { translations, Lang } from '@/lib/i18n';

const LangContext = createContext<{
  lang: Lang;
  t: typeof translations.ko;
  setLang: (l: Lang) => void;
}>({ lang: 'ko', t: translations.ko, setLang: () => {} });

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>('ko');

  useEffect(() => {
    const saved = localStorage.getItem('lang') as Lang;
    if (saved === 'ko' || saved === 'en') setLangState(saved);
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    localStorage.setItem('lang', l);
  };

  return (
    <LangContext.Provider value={{ lang, t: translations[lang], setLang }}>
      {children}
    </LangContext.Provider>
  );
}

export function useT() {
  return useContext(LangContext);
}
