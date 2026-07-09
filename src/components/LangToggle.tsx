"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useT } from "@/lib/LangContext";
import { useTheme } from "@/lib/ThemeContext";

function navClass(active: boolean) {
  return active
    ? "text-sm font-semibold text-emerald-600 dark:text-emerald-400 border-b-2 border-emerald-600 pb-0.5"
    : "text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-emerald-600 transition-colors";
}

export function LangToggle() {
  const { lang, setLang } = useT();
  return (
    <button
      onClick={() => setLang(lang === "ko" ? "en" : "ko")}
      className="px-2 py-1 text-xs font-medium border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      aria-label="Toggle language"
    >
      {lang === "ko" ? "EN" : "한글"}
    </button>
  );
}

export function NavBar() {
  const { t, lang, setLang } = useT();
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();
  const isAuthPage =
    pathname === "/login" || pathname === "/register" || pathname === "/" || pathname === "/onboarding";

  return (
    <nav className="sticky top-0 z-50 bg-white/95 dark:bg-gray-800/95 backdrop-blur shadow-sm border-b border-gray-200 dark:border-gray-700 pt-[env(safe-area-inset-top)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-14 md:h-16 items-center">
          <div className="flex items-center gap-2">
            <span className="text-2xl" aria-hidden>
              🥗
            </span>
            <Link href={isAuthPage ? "/" : "/dashboard"} className="text-xl font-bold text-emerald-600">
              123MOG
            </Link>
          </div>
          <div className="flex items-center gap-3 md:gap-5">
            {!isAuthPage && (
              <>
                <Link href="/dashboard" className={`hidden sm:inline ${navClass(pathname.startsWith("/dashboard"))}`}>
                  {t.nav.dashboard}
                </Link>
                <Link href="/meals" className={`hidden sm:inline ${navClass(pathname.startsWith("/meals"))}`}>
                  {t.nav.meals}
                </Link>
                <Link href="/profile" className={`hidden sm:inline ${navClass(pathname.startsWith("/profile"))}`}>
                  {t.nav.profile}
                </Link>
                <button
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="hidden sm:inline text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-red-600 transition-colors"
                >
                  {t.nav.logout}
                </button>
              </>
            )}
            <button
              onClick={() => setLang(lang === "ko" ? "en" : "ko")}
              className="min-w-11 min-h-11 px-2 text-xs font-medium border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="Toggle language"
            >
              {lang === "ko" ? "EN" : "한글"}
            </button>
            <button
              onClick={toggleTheme}
              aria-label="Toggle dark mode"
              className="min-w-11 min-h-11 px-2 text-xs font-medium border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              {theme === "dark" ? "☀️" : "🌙"}
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

export function BottomTabBar() {
  const { t } = useT();
  const pathname = usePathname();
  const hide =
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/" ||
    pathname === "/onboarding";
  if (hide) return null;

  const item = (href: string, label: string, icon: string, active: boolean) => (
    <Link
      href={href}
      className={`flex flex-col items-center justify-center flex-1 py-2 text-[11px] font-medium ${
        active ? "text-emerald-600" : "text-gray-500 dark:text-gray-400"
      }`}
    >
      <span className="text-lg leading-none mb-0.5" aria-hidden>
        {icon}
      </span>
      {label}
    </Link>
  );

  return (
    <div className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-stretch h-14 relative">
        {item("/dashboard", t.nav.dashboard, "📊", pathname.startsWith("/dashboard"))}
        {item("/meals", t.nav.meals, "🍽️", pathname.startsWith("/meals"))}
        <div className="flex-1 flex items-center justify-center -mt-5">
          <Link
            href={`/meals?date=${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}-${String(new Date().getDate()).padStart(2, "0")}`}
            className="w-14 h-14 rounded-full bg-emerald-600 text-white shadow-lg flex items-center justify-center text-2xl font-bold hover:bg-emerald-700"
            aria-label={t.nav.logFab}
          >
            +
          </Link>
        </div>
        {item("/profile", t.nav.profile, "👤", pathname.startsWith("/profile"))}
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex flex-col items-center justify-center flex-1 py-2 text-[11px] font-medium text-gray-500 dark:text-gray-400"
        >
          <span className="text-lg leading-none mb-0.5" aria-hidden>
            🚪
          </span>
          {t.nav.logout}
        </button>
      </div>
    </div>
  );
}

export function FloatingLogButton() {
  const { t } = useT();
  const pathname = usePathname();
  const hide =
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/" ||
    pathname === "/onboarding" ||
    pathname.startsWith("/meals");
  if (hide) return null;

  // Desktop FAB only (mobile has bottom bar +)
  return (
    <Link
      href="/meals"
      className="hidden md:flex fixed bottom-8 right-8 z-40 w-14 h-14 rounded-full bg-emerald-600 text-white shadow-xl items-center justify-center text-2xl font-bold hover:bg-emerald-700"
      aria-label={t.nav.logFab}
    >
      +
    </Link>
  );
}
