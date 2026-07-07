"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { useT } from "@/lib/LangContext";

interface DateNavProps { initialDate: string; }

export default function DateNav({ initialDate }: DateNavProps) {
  const { t } = useT();
  const router = useRouter();
  const searchParams = useSearchParams();
  const dateStr = searchParams.get("date") || initialDate;

  const today = new Date();
  const selectedDate = new Date(dateStr + "T00:00:00");

  const goToDate = (days: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + days);
    router.push(`/dashboard?date=${format(newDate, "yyyy-MM-dd")}`);
  };

  const isToday = format(selectedDate, "yyyy-MM-dd") === format(today, "yyyy-MM-dd");

  return (
    <div className="flex items-center justify-between mb-6">
      <h1 className="text-2xl font-bold text-gray-900">{t.dashboard.title}</h1>
      <div className="flex items-center gap-3">
        <button onClick={() => goToDate(-1)} className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-600">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <input type="date" value={dateStr} onChange={(e) => router.push(`/dashboard?date=${e.target.value}`)}
          className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none" />
        <button onClick={() => goToDate(1)} disabled={isToday}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
        </button>
        {!isToday && (
          <button onClick={() => router.push("/dashboard")} className="px-3 py-2 text-sm font-medium text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors">
            {t.dashboard.today}
          </button>
        )}
      </div>
    </div>
  );
}
