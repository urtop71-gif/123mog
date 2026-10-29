"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useT } from "@/lib/LangContext";
import { addDaysToKey } from "@/lib/dates";

interface DateNavProps {
  initialDate: string;
}

export default function DateNav({ initialDate }: DateNavProps) {
  const { t } = useT();
  const router = useRouter();
  const searchParams = useSearchParams();
  const dateStr = searchParams.get("date") || initialDate;
  // initialDate is "today" in the user's stored timezone, computed on the server.
  const today = initialDate;
  const isToday = dateStr === today;

  const goToDate = (days: number) => {
    const next = addDaysToKey(dateStr, days);
    router.push(`/dashboard?date=${next}`);
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t.dashboard.title}</h1>
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => goToDate(-1)}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-600 dark:text-gray-300"
          aria-label="Previous day"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <input
          type="date"
          value={dateStr}
          onChange={(e) => router.push(`/dashboard?date=${e.target.value}`)}
          className="input-field w-auto"
        />
        <button
          onClick={() => goToDate(1)}
          disabled={isToday}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-600 dark:text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed"
          aria-label="Next day"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
        {!isToday && (
          <button
            onClick={() => router.push("/dashboard")}
            className="px-3 py-2 text-sm font-medium text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950 rounded-lg transition-colors"
          >
            {t.dashboard.today}
          </button>
        )}
        {/* File download, not an App Router page. */}
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a
          href="/api/meals/export"
          className="px-3 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          ⬇ {t.dashboard.exportCsv}
        </a>
        <Link
          href={`/meals?date=${dateStr}`}
          className="px-3 py-2 text-sm font-medium bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
        >
          + {t.nav.logFab}
        </Link>
      </div>
    </div>
  );
}
