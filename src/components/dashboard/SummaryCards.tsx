"use client";

import { useT } from "@/lib/LangContext";

interface SummaryCardsProps {
  calories: { current: number; target: number };
  protein: { current: number; target: number };
  fat: { current: number; target: number };
  carbs: { current: number; target: number };
}

function MacroCard({ current, target, label, unit, color, isCal }: { current: number; target: number; label: string; unit: string; color: string; isCal?: boolean }) {
  const { t } = useT();
  const pct = target > 0 ? Math.min((current / target) * 100, 150) : 0;
  const isOver = current > target && target > 0;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex flex-col gap-3">
      <div className="flex justify-between items-start">
        <span className="text-sm font-medium text-gray-500">{label}</span>
        {isOver && isCal && <span className="text-xs font-medium text-red-500 bg-red-50 px-2 py-0.5 rounded-full">{t.dashboard.over}</span>}
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-bold text-gray-900">{Math.round(current)}</span>
        <span className="text-sm text-gray-400">/ {Math.round(target)} {unit}</span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${isOver && isCal ? "bg-red-500" : color}`} style={{ width: `${Math.min(pct, 100)}%` }} />
      </div>
      <span className={`text-xs font-medium ${isOver && isCal ? "text-red-500" : "text-gray-400"}`}>
        {pct.toFixed(0)}%{isOver && isCal && ` (${t.dashboard.targetExceeded})`}
      </span>
    </div>
  );
}

export default function SummaryCards({ calories, protein, fat, carbs }: SummaryCardsProps) {
  const { t } = useT();
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <MacroCard current={calories.current} target={calories.target} label={t.dashboard.calories} unit="kcal" color="bg-emerald-500" isCal />
      <MacroCard current={protein.current} target={protein.target} label={t.dashboard.protein} unit="g" color="bg-blue-500" />
      <MacroCard current={fat.current} target={fat.target} label={t.dashboard.fat} unit="g" color="bg-amber-500" />
      <MacroCard current={carbs.current} target={carbs.target} label={t.dashboard.carbs} unit="g" color="bg-purple-500" />
    </div>
  );
}
