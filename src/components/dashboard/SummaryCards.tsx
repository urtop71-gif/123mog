"use client";

import { useT } from "@/lib/LangContext";

interface Macro {
  current: number;
  target: number;
}

interface AdaptiveTdeeData {
  tdee: number;
  weightTrend: number;
  avgIntake: number;
  daysOfData: number;
  confidence: "low" | "medium" | "high";
  initialEstimate: number;
}

interface SummaryCardsProps {
  calories: Macro;
  protein: Macro;
  fat: Macro;
  carbs: Macro;
  sodium?: Macro;
  adaptiveTdee?: AdaptiveTdeeData | null;
}

function MacroCard({
  current,
  target,
  label,
  unit,
  color,
  highlightOver,
  large,
}: {
  current: number;
  target: number;
  label: string;
  unit: string;
  color: string;
  highlightOver?: boolean;
  large?: boolean;
}) {
  const { t } = useT();
  const pct = target > 0 ? Math.min((current / target) * 100, 150) : 0;
  const isOver = current > target && target > 0;
  const remaining = Math.max(0, target - current);

  return (
    <div
      className={`card p-4 sm:p-5 flex flex-col gap-2 ${large ? "sm:col-span-2 lg:col-span-1" : ""}`}
    >
      <div className="flex justify-between items-start">
        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</span>
        {isOver && highlightOver && (
          <span className="text-xs font-medium text-red-500 bg-red-50 dark:bg-red-950/40 px-2 py-0.5 rounded-full">
            {t.dashboard.over}
          </span>
        )}
      </div>
      <div className="flex items-baseline gap-1">
        <span className={`${large ? "text-3xl" : "text-2xl"} font-bold text-gray-900 dark:text-gray-100`}>
          {Math.round(current)}
        </span>
        <span className="text-sm text-gray-400 dark:text-gray-500">
          / {Math.round(target)} {unit}
        </span>
      </div>
      <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            isOver && highlightOver ? "bg-red-500" : color
          }`}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
      <div className="flex justify-between text-xs text-gray-400 dark:text-gray-500">
        <span
          className={
            isOver && highlightOver ? "text-red-500 font-medium" : ""
          }
        >
          {pct.toFixed(0)}%
          {isOver && highlightOver && ` (${t.dashboard.targetExceeded})`}
        </span>
        {!isOver && target > 0 && (
          <span>
            {Math.round(remaining)} {unit} {t.dashboard.remaining}
          </span>
        )}
      </div>
    </div>
  );
}

export default function SummaryCards({
  calories,
  protein,
  fat,
  carbs,
  sodium,
  adaptiveTdee,
}: SummaryCardsProps) {
  const { t } = useT();
  const tdeeDiff = adaptiveTdee
    ? adaptiveTdee.tdee - adaptiveTdee.initialEstimate
    : 0;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 mb-3">
      <MacroCard
        current={calories.current}
        target={calories.target}
        label={t.dashboard.calories}
        unit="kcal"
        color="bg-emerald-500"
        highlightOver
        large
      />
      <MacroCard
        current={protein.current}
        target={protein.target}
        label={t.dashboard.protein}
        unit="g"
        color="bg-blue-500"
      />
      <MacroCard
        current={fat.current}
        target={fat.target}
        label={t.dashboard.fat}
        unit="g"
        color="bg-amber-500"
      />
      <MacroCard
        current={carbs.current}
        target={carbs.target}
        label={t.dashboard.carbs}
        unit="g"
        color="bg-purple-500"
      />
      {sodium ? (
        <MacroCard
          current={sodium.current}
          target={sodium.target}
          label={t.profile.sodiumTarget}
          unit="mg"
          color="bg-rose-500"
          highlightOver
        />
      ) : (
        <div className="hidden lg:block" />
      )}

      {adaptiveTdee && (
        <div className="col-span-full flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-800/50 rounded-lg px-4 py-2">
          <span className="font-medium text-gray-600 dark:text-gray-300">
            🧠 Adaptive TDEE:{adaptiveTdee.tdee} kcal
          </span>
          <span>·</span>
          <span>
            vs static {adaptiveTdee.initialEstimate} kcal
            {tdeeDiff !== 0 && (
              <span className={tdeeDiff > 0 ? "text-emerald-500 ml-1" : "text-rose-500 ml-1"}>
                ({tdeeDiff > 0 ? "+" : ""}{tdeeDiff} kcal)
              </span>
            )}
          </span>
          <span>·</span>
          <span>
            {adaptiveTdee.daysOfData}d data
            {adaptiveTdee.confidence === "high" ? " ✅" : adaptiveTdee.confidence === "medium" ? " ⚡" : " 🔍"}
          </span>
          <span className="text-gray-300 dark:text-gray-600">{t.common.estimateNote}</span>
        </div>
      )}
    </div>
  );
}
