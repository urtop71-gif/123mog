"use client";

import { useCallback, useEffect, useState } from "react";
import { useT } from "@/lib/LangContext";
import { useToast } from "@/components/Toast";

export default function DayExtras({
  dateKey,
  sodiumCurrent,
  sodiumTarget,
  healthConditions,
  caloriesIn,
}: {
  dateKey: string;
  sodiumCurrent: number | null;
  sodiumTarget: number;
  healthConditions: string;
  caloriesIn: number;
}) {
  const { t } = useT();
  const { toast } = useToast();
  const [waterMl, setWaterMl] = useState(0);
  const [waterTarget, setWaterTarget] = useState(2000);
  const [addingWater, setAddingWater] = useState(false);
  const [streak, setStreak] = useState(0);
  const [weekDays, setWeekDays] = useState({ logged: 0, onTarget: 0 });
  const [weight, setWeight] = useState("");
  const [savingWeight, setSavingWeight] = useState(false);
  const [exerciseCalories, setExerciseCalories] = useState(0);
  const [exerciseSource, setExerciseSource] = useState<string | null>(null);
  const [exerciseInput, setExerciseInput] = useState("");
  const [savingExercise, setSavingExercise] = useState(false);

  const load = useCallback(async () => {
    const [waterRes, statsRes, exerciseRes] = await Promise.all([
      fetch(`/api/water?date=${dateKey}`),
      fetch("/api/meals/stats"),
      fetch(`/api/exercise?date=${dateKey}`),
    ]);
    if (waterRes.ok) {
      const w = await waterRes.json();
      setWaterMl(w.ml ?? 0);
      setWaterTarget(w.targetMl ?? 2000);
    }
    if (statsRes.ok) {
      const s = await statsRes.json();
      setStreak(s.streak ?? 0);
      setWeekDays({ logged: s.weekDaysLogged ?? 0, onTarget: s.weekDaysOnTarget ?? 0 });
    }
    if (exerciseRes.ok) {
      const ex = await exerciseRes.json();
      setExerciseCalories(ex.calories ?? 0);
      setExerciseSource(ex.source ?? null);
    }
  }, [dateKey]);

  useEffect(() => {
    load();
  }, [load]);

  const adjustWater = async (deltaMl: number) => {
    if (addingWater) return;
    if (deltaMl < 0 && waterMl <= 0) return;
    setAddingWater(true);
    const prevMl = waterMl;
    // Optimistic UI so taps feel instant on mobile (never below 0)
    setWaterMl((prev) => Math.max(0, prev + deltaMl));
    try {
      const res = await fetch("/api/water", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: dateKey, deltaMl }),
      });
      if (res.ok) {
        const data = await res.json();
        setWaterMl(data.ml);
      } else {
        setWaterMl(prevMl);
        toast(t.common.error, "error");
      }
    } catch {
      setWaterMl(prevMl);
      toast(t.common.error, "error");
    } finally {
      setAddingWater(false);
    }
  };

  const saveWeight = async () => {
    const w = parseFloat(weight);
    if (!w) return;
    setSavingWeight(true);
    const res = await fetch("/api/weight", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: dateKey, weight: w }),
    });
    setSavingWeight(false);
    if (res.ok) {
      toast(t.profile.saved);
      setWeight("");
    } else {
      toast(t.common.error, "error");
    }
  };

  const saveExercise = async () => {
    const cal = parseInt(exerciseInput, 10);
    if (!Number.isFinite(cal) || cal < 0) return;
    setSavingExercise(true);
    const res = await fetch("/api/exercise", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: dateKey, calories: cal }),
    });
    setSavingExercise(false);
    if (res.ok) {
      const data = await res.json();
      setExerciseCalories(data.calories);
      setExerciseSource(data.source);
      setExerciseInput("");
      toast(t.profile.saved);
    } else {
      toast(t.common.error, "error");
    }
  };

  const waterPct = waterTarget > 0 ? Math.min((waterMl / waterTarget) * 100, 100) : 0;
  const sodiumPct =
    sodiumCurrent != null && sodiumTarget > 0
      ? Math.min((sodiumCurrent / sodiumTarget) * 100, 150)
      : null;

  const conditions = healthConditions.split(",").filter(Boolean);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
      <div className="card p-4">
        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t.dashboard.streak}</div>
        <div className="text-2xl font-bold text-emerald-600">
          🔥 {streak}{" "}
          <span className="text-sm font-medium text-gray-500">{t.dashboard.days}</span>
        </div>
        <div className="text-xs text-gray-400 mt-2">
          {t.dashboard.weekProgress}: {weekDays.onTarget}/{weekDays.logged || 0}
        </div>
      </div>

      <div className="card p-4">
        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t.dashboard.water}</div>
        <div className="flex items-end justify-between gap-3 mb-2">
          <div className="text-2xl font-bold leading-none">
            {waterMl}
            <span className="text-sm font-normal text-gray-400"> / {waterTarget} ml</span>
          </div>
          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              onClick={() => adjustWater(-250)}
              disabled={addingWater || waterMl <= 0}
              className="min-h-12 min-w-[5.5rem] px-3 py-3 rounded-xl border-2 border-sky-400 bg-white dark:bg-gray-800 text-sky-700 dark:text-sky-300 text-base font-bold hover:bg-sky-50 dark:hover:bg-sky-950 active:bg-sky-100 disabled:opacity-40 touch-manipulation select-none"
              aria-label={t.dashboard.removeWater}
            >
              {t.dashboard.removeWater}
            </button>
            <button
              type="button"
              onClick={() => adjustWater(250)}
              disabled={addingWater}
              className="min-h-12 min-w-[5.5rem] px-3 py-3 rounded-xl bg-sky-500 hover:bg-sky-600 active:bg-sky-700 text-white text-base font-bold shadow-md shadow-sky-500/30 disabled:opacity-60 touch-manipulation select-none"
              aria-label={t.dashboard.addWater}
            >
              {t.dashboard.addWater}
            </button>
          </div>
        </div>
        <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2.5">
          <div className="h-full rounded-full bg-sky-500 transition-[width]" style={{ width: `${waterPct}%` }} />
        </div>
      </div>

      <div className="card p-4">
        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t.dashboard.exercise}</div>
        <div className="text-2xl font-bold leading-none mb-1">
          {exerciseCalories}
          <span className="text-sm font-normal text-gray-400"> kcal</span>
        </div>
        <div className="text-xs text-gray-400 mb-2">
          {exerciseSource === "healthkit"
            ? t.dashboard.exerciseSourceHealthkit
            : exerciseSource === "manual"
              ? t.dashboard.exerciseSourceManual
              : "—"}
        </div>
        <div className="text-xs text-gray-400 mb-2">
          {t.dashboard.netCalories}: {Math.round(caloriesIn - exerciseCalories)} kcal
        </div>
        <div className="flex gap-2">
          <input
            type="number"
            value={exerciseInput}
            onChange={(e) => setExerciseInput(e.target.value)}
            placeholder="kcal"
            className="input-field"
            aria-label={t.dashboard.exercise}
          />
          <button
            onClick={saveExercise}
            disabled={savingExercise || !exerciseInput}
            className="btn-primary whitespace-nowrap px-3"
          >
            {t.common.save}
          </button>
        </div>
      </div>

      <div className="card p-4">
        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t.dashboard.weight}</div>
        <div className="flex gap-2">
          <input
            type="number"
            step="0.1"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder="kg"
            className="input-field"
            aria-label={t.dashboard.logWeight}
          />
          <button
            onClick={saveWeight}
            disabled={savingWeight || !weight}
            className="btn-primary whitespace-nowrap px-3"
          >
            {t.common.save}
          </button>
        </div>
      </div>

      <div className="card p-4">
        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t.dashboard.healthSummary}</div>
        {conditions.length === 0 ? (
          <p className="text-sm text-gray-400">—</p>
        ) : (
          <ul className="text-sm space-y-1">
            {conditions.includes("hypertension") && sodiumPct != null && (
              <li>
                {t.dashboard.sodiumProgress}: {Math.round(sodiumCurrent!)} / {sodiumTarget} mg (
                {sodiumPct.toFixed(0)}%)
              </li>
            )}
            {conditions.includes("diabetes") && (
              <li className="text-gray-600 dark:text-gray-300">{t.profile.diabetesDesc}</li>
            )}
            {conditions.includes("high_cholesterol") && (
              <li className="text-gray-600 dark:text-gray-300">{t.profile.cholesterolDesc}</li>
            )}
          </ul>
        )}
        {sodiumPct != null && !conditions.includes("hypertension") && (
          <p className="text-xs text-gray-400 mt-1">
            {t.dashboard.sodiumProgress}: {Math.round(sodiumCurrent!)} mg
          </p>
        )}
      </div>
    </div>
  );
}
