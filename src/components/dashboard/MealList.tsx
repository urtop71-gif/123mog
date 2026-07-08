"use client";

import { useT } from "@/lib/LangContext";

interface MealItem {
  id: string; foodName: string; healthTags?: string | null;
  quantity: number; unitName: string; totalCalories: number;
}

interface MealGroup {
  mealType: string;
  items: MealItem[];
  totalCalories: number;
}

interface MealListProps { meals: MealGroup[]; }

export default function MealList({ meals }: MealListProps) {
  const { t, lang } = useT();

  const MEAL_TYPE_CONFIG: Record<string, { emoji: string; color: string; label: string }> = {
    breakfast: { emoji: "🌅", color: "border-l-emerald-500", label: t.meals.breakfast },
    lunch: { emoji: "☀️", color: "border-l-blue-500", label: t.meals.lunch },
    dinner: { emoji: "🌙", color: "border-l-indigo-500", label: t.meals.dinner },
    snack: { emoji: "🍪", color: "border-l-pink-500", label: t.meals.snack },
  };

  if (meals.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-8 text-center mb-8">
        <p className="text-gray-400 dark:text-gray-500">{t.dashboard.empty}</p>
        <p className="text-sm text-gray-300 dark:text-gray-600 mt-1">{t.dashboard.emptyHint}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 mb-8">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{t.dashboard.mealList}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {meals.map((meal, index) => {
          const config = MEAL_TYPE_CONFIG[meal.mealType] || { emoji: "🍽️", color: "border-l-gray-400", label: meal.mealType };
          return (
            <div key={meal.mealType + "-" + index} className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 border-l-4 ${config.color} p-4`}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">{config.emoji} {config.label}</h3>
                <span className="text-sm font-medium text-emerald-600">{Math.round(meal.totalCalories)} kcal</span>
              </div>
              {meal.items.length > 0 ? (
                <ul className="space-y-2">
                  {meal.items.map((item) => (
                    <li key={item.id} className="flex justify-between items-center text-sm">
                      <span className="text-gray-700 dark:text-gray-300">
                        {item.foodName}
                        {item.healthTags?.includes('ldl_good') && <span className="ml-0.5 text-[9px] bg-green-100 dark:bg-green-900 text-green-700 px-1 rounded">🫀LDL</span>}
                        {item.healthTags?.includes('ldl_bad') && <span className="ml-0.5 text-[9px] bg-red-100 dark:bg-red-900 text-red-700 px-1 rounded">🫀LDL</span>}
                        {item.healthTags?.includes('ldl_neutral') && <span className="ml-0.5 text-[9px] bg-yellow-100 dark:bg-yellow-900 text-yellow-700 px-1 rounded">🫀LDL</span>}
                        {item.healthTags?.includes('sugar_good') && <span className="ml-0.5 text-[9px] bg-green-100 dark:bg-green-900 text-green-700 px-1 rounded">🩸{lang === 'ko' ? '혈당' : 'Sugar'}</span>}
                        {item.healthTags?.includes('sugar_bad') && <span className="ml-0.5 text-[9px] bg-red-100 dark:bg-red-900 text-red-700 px-1 rounded">🩸{lang === 'ko' ? '혈당' : 'Sugar'}</span>}
                        {item.healthTags?.includes('sugar_neutral') && <span className="ml-0.5 text-[9px] bg-yellow-100 dark:bg-yellow-900 text-yellow-700 px-1 rounded">🩸{lang === 'ko' ? '혈당' : 'Sugar'}</span>}
                        {item.healthTags?.includes('sodium_good') && <span className="ml-0.5 text-[9px] bg-green-100 dark:bg-green-900 text-green-700 px-1 rounded">💚{lang === 'ko' ? '혈압' : 'BP'}</span>}
                        {item.healthTags?.includes('sodium_bad') && <span className="ml-0.5 text-[9px] bg-red-100 dark:bg-red-900 text-red-700 px-1 rounded">❤️{lang === 'ko' ? '혈압' : 'BP'}</span>}
                        {item.healthTags?.includes('sodium_neutral') && <span className="ml-0.5 text-[9px] bg-yellow-100 dark:bg-yellow-900 text-yellow-700 px-1 rounded">💛{lang === 'ko' ? '혈압' : 'BP'}</span>}
                      </span>
                      <span className="text-gray-400 dark:text-gray-500">{item.quantity}{item.unitName} · {Math.round(item.totalCalories)} kcal</span>
                    </li>
                  ))}
                </ul>
              ) : (<p className="text-sm text-gray-400 dark:text-gray-500">{t.dashboard.empty}</p>)}
            </div>
          );
        })}
      </div>
    </div>
  );
}
