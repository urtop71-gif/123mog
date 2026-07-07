"use client";

import { useRouter } from "next/navigation";
import { useT } from "@/lib/LangContext";

export default function Home() {
  const { t } = useT();

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="text-center max-w-lg">
        <span className="text-6xl">🥗</span>
        <h1 className="text-3xl font-bold text-gray-900 mt-6">{t.app.name}</h1>
        <p className="text-gray-500 mt-3 text-lg">{t.app.tagline}</p>
        <div className="flex gap-4 justify-center mt-8">
          <a href="/login" className="px-6 py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors">
            {t.home.login}
          </a>
          <a href="/register" className="px-6 py-3 bg-white text-emerald-600 border border-emerald-600 rounded-lg font-medium hover:bg-emerald-50 transition-colors">
            {t.home.register}
          </a>
        </div>
        <div className="mt-12 grid grid-cols-3 gap-4 text-left">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="text-2xl mb-2">🔍</div>
            <h3 className="font-semibold text-gray-900 text-sm">{t.home.feature1}</h3>
            <p className="text-xs text-gray-400 mt-1">{t.home.feature1desc}</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="text-2xl mb-2">📊</div>
            <h3 className="font-semibold text-gray-900 text-sm">{t.home.feature2}</h3>
            <p className="text-xs text-gray-400 mt-1">{t.home.feature2desc}</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="text-2xl mb-2">🎯</div>
            <h3 className="font-semibold text-gray-900 text-sm">{t.home.feature3}</h3>
            <p className="text-xs text-gray-400 mt-1">{t.home.feature3desc}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
