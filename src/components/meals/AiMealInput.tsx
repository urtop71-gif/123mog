"use client";

import { useEffect, useState } from "react";
import { useT } from "@/lib/LangContext";
import { useToast } from "@/components/Toast";

interface DraftFood {
  id: string;
  name: string;
  nameEn?: string | null;
  isAiEstimate?: boolean;
  servings: { unitName: string; gramsPerUnit: number }[];
  caloriesPer100g: number;
}

interface DraftItem {
  name: string;
  quantity: number;
  unit: string | null;
  matched: boolean;
  food: DraftFood | null;
  estimate: {
    calories: number | null;
    protein: number | null;
    fat: number | null;
    carbs: number | null;
    sodium: number | null;
  };
}

function compressPhoto(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const url = URL.createObjectURL(file);
    image.onload = () => {
      const max = 1024;
      const scale = Math.min(1, max / Math.max(image.width, image.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(image.width * scale));
      canvas.height = Math.max(1, Math.round(image.height * scale));
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        URL.revokeObjectURL(url);
        reject(new Error("canvas"));
        return;
      }
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", 0.7));
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("image"));
    };
    image.src = url;
  });
}

export default function AiMealInput({
  dateKey,
  mealType,
  onSaved,
}: {
  dateKey: string;
  mealType: string;
  onSaved: () => void;
}) {
  const { t } = useT();
  const { toast } = useToast();
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [text, setText] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [drafts, setDrafts] = useState<DraftItem[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/meals/parse");
        if (cancelled) return;
        if (!res.ok) {
          console.error("AI meal input unavailable:", res.status);
          return;
        }
        const data = await res.json();
        if (!cancelled) setEnabled(!!data.enabled);
      } catch (error) {
        console.error("AI meal input unavailable:", error);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (enabled !== true) return null;

  const analyze = async () => {
    if (!text.trim() && !photo) return;
    setBusy(true);
    const res = await fetch("/api/meals/parse", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: text.trim(),
        imageBase64: photo ?? undefined,
        mimeType: photo ? "image/jpeg" : undefined,
      }),
    });
    setBusy(false);
    if (!res.ok) {
      toast(res.status === 429 ? t.common.tooMany : t.meals.aiFailed, "error");
      return;
    }
    const data = await res.json();
    const items = (data.items ?? []) as DraftItem[];
    if (items.length === 0) {
      toast(t.meals.aiEmpty, "info");
      setDrafts(null);
      return;
    }
    setDrafts(items);
  };

  const update = (index: number, patch: Partial<DraftItem>) => {
    setDrafts((prev) => prev?.map((item, i) => (i === index ? { ...item, ...patch } : item)) ?? null);
  };

  const save = async () => {
    if (!drafts || drafts.length === 0) return;
    setBusy(true);
    const res = await fetch("/api/meals/ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date: dateKey,
        mealType,
        items: drafts.map((item) => {
          const unitName = item.unit || item.food?.servings[0]?.unitName || "인분";
          if (item.matched && item.food) {
            return { foodId: item.food.id, quantity: item.quantity, unitName };
          }
          return {
            quantity: item.quantity,
            unitName,
            estimate: {
              name: item.name,
              calories: item.estimate.calories ?? 0,
              protein: item.estimate.protein,
              fat: item.estimate.fat,
              carbs: item.estimate.carbs,
              sodium: item.estimate.sodium,
            },
          };
        }),
      }),
    });
    setBusy(false);
    if (!res.ok) {
      toast(t.common.error, "error");
      return;
    }
    setDrafts(null);
    setText("");
    setPhoto(null);
    toast(t.meals.recorded);
    onSaved();
  };

  const lineCalories = (item: DraftItem) => {
    if (item.matched && item.food) {
      const serving =
        item.food.servings.find((s) => s.unitName === item.unit) || item.food.servings[0];
      if (!serving) return null;
      return Math.round(item.food.caloriesPer100g * ((item.quantity * serving.gramsPerUnit) / 100));
    }
    return item.estimate.calories;
  };

  return (
    <div className="card p-4 mb-4 space-y-3">
      <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{t.meals.aiTitle}</h2>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={t.meals.aiPlaceholder}
        rows={2}
        className="input-field min-h-16"
        aria-label={t.meals.aiTitle}
      />
      <div className="flex flex-wrap items-center gap-2">
        <label className="min-h-11 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm cursor-pointer">
          {t.meals.aiPhoto}
          <input
            type="file"
            accept="image/*"
            capture="environment"
            className="sr-only"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (!file) return;
              try {
                setPhoto(await compressPhoto(file));
              } catch {
                toast(t.common.error, "error");
              }
            }}
          />
        </label>
        {photo && (
          <button type="button" className="text-xs text-gray-500 underline" onClick={() => setPhoto(null)}>
            {t.common.cancel}
          </button>
        )}
        <button
          type="button"
          onClick={analyze}
          disabled={busy || (!text.trim() && !photo)}
          className="btn-primary min-h-11 px-4"
        >
          {busy ? t.meals.saving : t.meals.aiAnalyze}
        </button>
      </div>
      <p className="text-[11px] text-gray-400">{t.meals.aiDisclaimer}</p>

      {drafts && (
        <div className="space-y-3 border-t border-gray-100 dark:border-gray-700 pt-3">
          {drafts.map((item, index) => (
            <div key={`${item.name}-${index}`} className="space-y-1">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="font-medium text-sm truncate">
                    {item.matched && item.food ? item.food.name : item.name}
                  </div>
                  <div className="text-[11px] text-amber-700 dark:text-amber-300">
                    {item.matched ? t.meals.aiMatched : t.meals.aiUnmatched}
                    {item.food?.isAiEstimate ? ` · ${t.meals.aiEstimateBadge}` : ""}
                  </div>
                </div>
                <button
                  type="button"
                  className="text-xs text-red-500 min-h-11 px-2"
                  onClick={() => setDrafts(drafts.filter((_, i) => i !== index))}
                >
                  {t.meals.remove}
                </button>
              </div>
              <div className="flex gap-2">
                <input
                  type="number"
                  min={0.1}
                  step={0.5}
                  value={item.quantity}
                  onChange={(e) => update(index, { quantity: parseFloat(e.target.value) || 0 })}
                  className="input-field w-20"
                  aria-label={t.meals.quickQty}
                />
                {item.food && item.food.servings.length > 0 ? (
                  <select
                    value={item.unit || item.food.servings[0].unitName}
                    onChange={(e) => update(index, { unit: e.target.value })}
                    className="input-field flex-1"
                  >
                    {item.food.servings.map((s) => (
                      <option key={s.unitName} value={s.unitName}>
                        {s.unitName}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    value={item.unit || ""}
                    onChange={(e) => update(index, { unit: e.target.value })}
                    className="input-field flex-1"
                    placeholder={t.meals.customFoodServingName}
                  />
                )}
                <span className="text-sm text-emerald-600 self-center whitespace-nowrap">
                  {lineCalories(item) != null ? `~${lineCalories(item)} kcal` : "—"}
                </span>
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={save}
            disabled={busy || drafts.length === 0 || drafts.some((item) => item.quantity <= 0)}
            className="w-full btn-primary min-h-11"
          >
            {t.meals.aiConfirm}
          </button>
        </div>
      )}
    </div>
  );
}
