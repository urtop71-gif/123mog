"use client";

import { useT } from "@/lib/LangContext";

export function LangToggle() {
  const { lang, setLang } = useT();

  return (
    <button
      onClick={() => setLang(lang === 'ko' ? 'en' : 'ko')}
      className="px-2 py-1 text-xs font-medium border border-gray-300 rounded-md hover:bg-gray-100 transition-colors"
    >
      {lang === 'ko' ? 'EN' : '한글'}
    </button>
  );
}

export function NavBar() {
  const { t, lang, setLang } = useT();

  return (
    <nav className="sticky top-0 z-50 bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🥗</span>
            <a href="/dashboard" className="text-xl font-bold text-emerald-600">123MOG</a>
          </div>
          <div className="flex items-center gap-6">
            <a href="/dashboard" className="text-sm font-medium text-gray-700 hover:text-emerald-600 transition-colors">
              {t.nav.dashboard}
            </a>
            <a href="/meals" className="text-sm font-medium text-gray-700 hover:text-emerald-600 transition-colors">
              {t.nav.meals}
            </a>
            <a href="/profile" className="text-sm font-medium text-gray-700 hover:text-emerald-600 transition-colors">
              {t.nav.profile}
            </a>
            <button
              onClick={() => setLang(lang === 'ko' ? 'en' : 'ko')}
              className="px-2 py-1 text-xs font-medium border border-gray-300 rounded-md hover:bg-gray-100 transition-colors"
            >
              {lang === 'ko' ? 'EN' : '한글'}
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
