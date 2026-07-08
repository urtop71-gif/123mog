"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useT } from "@/lib/LangContext";

interface FoodItem {
  id: string; name: string; nameEn?: string | null; category: string;
  caloriesPer100g: number; proteinPer100g: number; fatPer100g: number; carbsPer100g: number;
  sodiumPer100g?: number | null;
  healthTags?: string;
  servings: { unitName: string; gramsPerUnit: number }[];
}

interface MealItemInput { foodId: string; quantity: number; unitName: string; }

interface MealHistoryItem {
  id: string;
  foodId: string;
  foodName: string;
  healthTags?: string | null;
  quantity: number;
  unitName: string;
  totalCalories: number;
}

interface MealHistoryEntry {
  id: string;
  mealType: string;
  totalCalories: number;
  items: MealHistoryItem[];
}

const MEAL_TYPES = [
  { value: "breakfast", label: "breakfast" },
  { value: "lunch", label: "lunch" },
  { value: "dinner", label: "dinner" },
  { value: "snack", label: "snack" },
];

export default function MealsPage() {
  const { t, lang } = useT();
  const router = useRouter();
  const [mealType, setMealType] = useState("lunch");
  const [searchQuery, setSearchQuery] = useState("");
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [unitName, setUnitName] = useState("");
  const [cart, setCart] = useState<MealItemInput[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [editMealId, setEditMealId] = useState<string | null>(null);
  const [showCustomFoodForm, setShowCustomFoodForm] = useState(false);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (!searchQuery) { setFoods([]); return; }
      setSearching(true);
      const params = new URLSearchParams({ q: searchQuery });
      const res = await fetch(`/api/foods?${params}`);
      if (res.ok) setFoods(await res.json());
      setSearching(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const addToCart = () => {
    if (!selectedFood || !unitName || quantity <= 0) return;
    setCart([...cart, { foodId: selectedFood.id, quantity, unitName }]);
    setSelectedFood(null); setQuantity(1); setUnitName(""); setSearchQuery("");
  };

  const removeFromCart = (index: number) => { setCart(cart.filter((_, i) => i !== index)); };

  const submitMeal = async () => {
    if (cart.length === 0) return;
    setSubmitting(true);
    const url = editMealId ? `/api/meals/${editMealId}` : '/api/meals';
    const method = editMealId ? 'PUT' : 'POST';
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mealType, items: cart }) });
    if (res.ok) {
      setCart([]); setEditMealId(null);
      setMessage(editMealId ? t.meals.updated : t.meals.recorded);
      setTimeout(() => { setMessage(""); window.location.reload(); }, 1000);
      router.refresh();
    } else {
      const data = await res.json(); setMessage(`Error: ${data.error}`);
    }
    setSubmitting(false);
  };

  const getFoodName = (foodId: string) => foods.find((f) => f.id === foodId)?.name || foodId;

  const getTagBadge = (tags?: string) => {
    if (!tags) return null;
    const tagList = tags.split(',');
    const badges: { emoji: string; label: string; color: string }[] = [];
    if (tagList.includes('ldl_good')) badges.push({ emoji: '🫀', label: 'LDL', color: 'bg-green-100 dark:bg-green-900 text-green-700' });
    else if (tagList.includes('ldl_bad')) badges.push({ emoji: '🫀', label: 'LDL', color: 'bg-red-100 dark:bg-red-900 text-red-700' });
    else if (tagList.includes('ldl_neutral')) badges.push({ emoji: '🫀', label: 'LDL', color: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700' });
    const sugarLabel = lang === 'ko' ? '혈당' : 'Sugar';
    if (tagList.includes('sugar_good')) badges.push({ emoji: '🩸', label: sugarLabel, color: 'bg-green-100 dark:bg-green-900 text-green-700' });
    else if (tagList.includes('sugar_bad')) badges.push({ emoji: '🩸', label: sugarLabel, color: 'bg-red-100 dark:bg-red-900 text-red-700' });
    else if (tagList.includes('sugar_neutral')) badges.push({ emoji: '🩸', label: sugarLabel, color: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700' });
    const bpLabel = lang === 'ko' ? '혈압' : 'BP';
    if (tagList.includes('sodium_good')) badges.push({ emoji: '💚', label: bpLabel, color: 'bg-green-100 dark:bg-green-900 text-green-700' });
    else if (tagList.includes('sodium_bad')) badges.push({ emoji: '❤️', label: bpLabel, color: 'bg-red-100 dark:bg-red-900 text-red-700' });
    else if (tagList.includes('sodium_neutral')) badges.push({ emoji: '💛', label: bpLabel, color: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700' });
    return badges;
  };

  const mealLabel = (mt: string) => {
    const map: Record<string, string> = { breakfast: t.meals.breakfast, lunch: t.meals.lunch, dinner: t.meals.dinner, snack: t.meals.snack };
    return map[mt] || mt;
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">{t.meals.title}</h1>

      {message && (
        <div className={`mb-4 px-4 py-3 rounded-lg text-sm font-medium ${message.includes("Error") ? "bg-red-50 dark:bg-red-950/40 text-red-600" : "bg-emerald-50 dark:bg-emerald-950 text-emerald-600"}`}>
          {message}
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-5 mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t.meals.mealType}</label>
        <div className="grid grid-cols-4 gap-2">
          {MEAL_TYPES.map((mt) => (
            <button key={mt.value} onClick={() => setMealType(mt.value)}
              className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors ${mealType === mt.value ? "bg-emerald-600 text-white" : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200"}`}>
              {mealLabel(mt.value)}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-5 mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t.meals.search}</label>
        <div className="flex gap-2 mb-3">
          <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.meals.searchPlaceholder}
            className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none" />
        </div>

        {searching && !selectedFood && (
          <p className="text-sm text-gray-400 dark:text-gray-500 py-2">{t.meals.searching}</p>
        )}

        {!searching && foods.length > 0 && !selectedFood && (
          <ul className="max-h-48 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg divide-y">
            {foods.map((food) => (
              <li key={food.id} onClick={() => { setSelectedFood(food); setUnitName(food.servings[1]?.unitName || food.servings[0]?.unitName || "g"); }}
                className="px-4 py-3 hover:bg-emerald-50 cursor-pointer flex justify-between items-center">
                <div><span className="font-medium text-gray-800 dark:text-gray-200">{lang === 'en' && food.category !== 'korean' && food.nameEn ? food.nameEn : food.name}</span>
                  {getTagBadge(food.healthTags)?.map((b, i) => (<span key={i} className={`ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full font-medium ${b.color}`}>{b.emoji} {b.label}</span>))}
                </div>
                <span className="text-xs text-gray-400 dark:text-gray-500">{food.caloriesPer100g}kcal/100g</span>
              </li>
            ))}
          </ul>
        )}

        {!searching && foods.length === 0 && searchQuery && !selectedFood && (
          <div className="py-3 text-center">
            <p className="text-sm text-gray-400 dark:text-gray-500 mb-2">{t.meals.noResults}</p>
            <button onClick={() => setShowCustomFoodForm(true)} className="text-xs text-emerald-600 hover:underline font-medium">
              + {t.meals.addCustomFood}
            </button>
          </div>
        )}

        {showCustomFoodForm && (
          <CustomFoodForm
            initialName={searchQuery}
            onCancel={() => setShowCustomFoodForm(false)}
            onCreated={(food) => {
              setShowCustomFoodForm(false);
              setSelectedFood(food);
              setUnitName(food.servings[0]?.unitName || "g");
            }}
          />
        )}

        {selectedFood && (
          <div className="mt-3 p-4 bg-emerald-50 dark:bg-emerald-950 rounded-lg">
            <div className="flex justify-between mb-2">
              <div><span className="font-semibold text-gray-900 dark:text-gray-100">{lang === 'en' && selectedFood.category !== 'korean' && selectedFood.nameEn ? selectedFood.nameEn : selectedFood.name}</span>
                {getTagBadge(selectedFood.healthTags)?.map((b, i) => (<span key={i} className={`ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full font-medium ${b.color}`}>{b.emoji} {b.label}</span>))}
              </div>
              <button onClick={() => setSelectedFood(null)} className="text-gray-400 dark:text-gray-500 hover:text-gray-600">✕</button>
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-3">
              P: {selectedFood.proteinPer100g}g | F: {selectedFood.fatPer100g}g | C: {selectedFood.carbsPer100g}g
              {selectedFood.sodiumPer100g != null && ` | ${t.meals.sodium}: ${selectedFood.sodiumPer100g}mg`} (per 100g)
            </div>
            <div className="flex gap-2">
              <input type="number" value={quantity || ""} onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
                min={0.1} step={0.5} className="w-20 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="Qty" />
              <select value={unitName} onChange={(e) => setUnitName(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none bg-white dark:bg-gray-800">
                {selectedFood.servings.map((s) => (<option key={s.unitName} value={s.unitName}>{s.unitName} ({s.gramsPerUnit}g)</option>))}
              </select>
              <button onClick={addToCart} disabled={quantity <= 0 || !unitName}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 transition-colors">
                {t.meals.add}
              </button>
            </div>
          </div>
        )}
      </div>

      {cart.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-5 mb-4">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">{t.meals.cart}</h3>
          <ul className="space-y-2">
            {cart.map((item, i) => (
              <li key={i} className="flex justify-between items-center text-sm py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
                <span className="text-gray-700 dark:text-gray-300">{getFoodName(item.foodId)}</span>
                <div className="flex items-center gap-2">
                  <span className="text-gray-400 dark:text-gray-500">{item.quantity}{item.unitName}</span>
                  <button onClick={() => removeFromCart(i)} className="text-red-400 hover:text-red-600 text-xs">{t.meals.remove}</button>
                </div>
              </li>
            ))}
          </ul>
          <button onClick={submitMeal} disabled={submitting}
            className="mt-4 w-full py-2.5 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50">
            {submitting ? t.meals.saving : editMealId ? t.meals.edit : t.meals.submit}
          </button>
        </div>
      )}

      <MealHistory onEdit={(meal: MealHistoryEntry) => {
        setMealType(meal.mealType);
        setCart(meal.items.map((item) => ({ foodId: item.foodId, quantity: item.quantity, unitName: item.unitName })));
        setEditMealId(meal.id);
      }} />
    </div>
  );
}

function MealHistory({ onEdit }: { onEdit: (meal: MealHistoryEntry) => void }) {
  const { t, lang } = useT();
  const [meals, setMeals] = useState<MealHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const today = new Date().toISOString().split('T')[0];
  const fetchMeals = useCallback(async () => {
    const res = await fetch(`/api/meals?date=${today}`);
    if (res.ok) setMeals(await res.json());
    setLoading(false);
  }, [today]);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- standard fetch-on-mount; setState only runs after the awaited fetch resolves, not synchronously
  useEffect(() => { fetchMeals(); }, [fetchMeals]);

  const deleteMeal = async (id: string) => {
    if (!confirm(t.meals.confirmDelete)) return;
    await fetch(`/api/meals/${id}`, { method: 'DELETE' });
    setMeals(meals.filter(m => m.id !== id));
    router.refresh();
  };

  const deleteItem = async (mealId: string, itemId: string) => {
    if (!confirm(t.meals.confirmDelete)) return;
    await fetch(`/api/meals/${mealId}/items/${itemId}`, { method: 'DELETE' });
    await fetchMeals();
    router.refresh();
  };

  const mealLabel = (mt: string) => {
    const map: Record<string, string> = { breakfast: t.meals.breakfast, lunch: t.meals.lunch, dinner: t.meals.dinner, snack: t.meals.snack };
    return map[mt] || mt;
  };

  if (loading) return null;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-5">
      <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">{t.meals.today}</h3>
      {meals.length === 0 ? (
        <p className="text-sm text-gray-400 dark:text-gray-500">{t.meals.empty}</p>
      ) : (
        <div className="space-y-3">
          {meals.map((meal) => (
            <div key={meal.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-800 dark:text-gray-200">{mealLabel(meal.mealType)}</span>
                  <span className="text-emerald-600 font-medium">{Math.round(meal.totalCalories)} kcal</span>
                </div>
                <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                  {meal.items?.map((item) => (
                    <span key={item.id} className="mr-2 inline-flex items-center">
                      {item.foodName} {item.quantity}{item.unitName}
                      {item.healthTags?.includes('ldl_good') && <span className="ml-0.5 text-[9px] bg-green-100 dark:bg-green-900 text-green-700 px-1 rounded">🫀LDL</span>}
                      {item.healthTags?.includes('ldl_bad') && <span className="ml-0.5 text-[9px] bg-red-100 dark:bg-red-900 text-red-700 px-1 rounded">🫀LDL</span>}
                      {item.healthTags?.includes('ldl_neutral') && <span className="ml-0.5 text-[9px] bg-yellow-100 dark:bg-yellow-900 text-yellow-700 px-1 rounded">🫀LDL</span>}
                      {item.healthTags?.includes('sugar_good') && <span className="ml-0.5 text-[9px] bg-green-100 dark:bg-green-900 text-green-700 px-1 rounded">🩸{lang === 'ko' ? '혈당' : 'Sugar'}</span>}
                      {item.healthTags?.includes('sugar_bad') && <span className="ml-0.5 text-[9px] bg-red-100 dark:bg-red-900 text-red-700 px-1 rounded">🩸{lang === 'ko' ? '혈당' : 'Sugar'}</span>}
                      {item.healthTags?.includes('sugar_neutral') && <span className="ml-0.5 text-[9px] bg-yellow-100 dark:bg-yellow-900 text-yellow-700 px-1 rounded">🩸{lang === 'ko' ? '혈당' : 'Sugar'}</span>}
                      {item.healthTags?.includes('sodium_good') && <span className="ml-0.5 text-[9px] bg-green-100 dark:bg-green-900 text-green-700 px-1 rounded">💚{lang === 'ko' ? '혈압' : 'BP'}</span>}
                      {item.healthTags?.includes('sodium_bad') && <span className="ml-0.5 text-[9px] bg-red-100 dark:bg-red-900 text-red-700 px-1 rounded">❤️{lang === 'ko' ? '혈압' : 'BP'}</span>}
                      {item.healthTags?.includes('sodium_neutral') && <span className="ml-0.5 text-[9px] bg-yellow-100 dark:bg-yellow-900 text-yellow-700 px-1 rounded">💛{lang === 'ko' ? '혈압' : 'BP'}</span>}
                      <button onClick={() => deleteItem(meal.id, item.id)} title={t.meals.deleteBtn}
                        className="ml-0.5 text-gray-300 dark:text-gray-600 hover:text-red-500">✕</button>
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex gap-1">
                <button onClick={() => onEdit(meal)} className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 rounded hover:bg-blue-200">{t.meals.editBtn}</button>
                <button onClick={() => deleteMeal(meal.id)} className="px-2 py-1 text-xs bg-red-100 dark:bg-red-900 text-red-700 rounded hover:bg-red-200">{t.meals.deleteBtn}</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CustomFoodForm({
  initialName,
  onCancel,
  onCreated,
}: {
  initialName: string;
  onCancel: () => void;
  onCreated: (food: FoodItem) => void;
}) {
  const { t } = useT();
  const [name, setName] = useState(initialName);
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [fat, setFat] = useState("");
  const [carbs, setCarbs] = useState("");
  const [sodium, setSodium] = useState("");
  const [servingName, setServingName] = useState("");
  const [servingGrams, setServingGrams] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    setSubmitting(true);
    setError("");
    const servings = [{ unitName: "g", gramsPerUnit: 1 }];
    if (servingName && servingGrams) {
      servings.unshift({ unitName: servingName, gramsPerUnit: parseFloat(servingGrams) });
    }
    const res = await fetch("/api/foods", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        category: "general",
        caloriesPer100g: parseFloat(calories) || 0,
        proteinPer100g: parseFloat(protein) || 0,
        fatPer100g: parseFloat(fat) || 0,
        carbsPer100g: parseFloat(carbs) || 0,
        sodiumPer100g: sodium ? parseFloat(sodium) : null,
        servings,
      }),
    });
    if (res.ok) {
      onCreated(await res.json());
    } else {
      const data = await res.json();
      setError(data.error || "Error");
    }
    setSubmitting(false);
  };

  return (
    <div className="mt-3 p-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg space-y-3">
      {error && <p className="text-xs text-red-600">{error}</p>}
      <input type="text" value={name} onChange={(e) => setName(e.target.value)}
        placeholder={t.meals.customFoodName}
        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none" />
      <div className="grid grid-cols-2 gap-2">
        <input type="number" value={calories} onChange={(e) => setCalories(e.target.value)}
          placeholder={t.meals.customFoodCalories}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none" />
        <input type="number" value={protein} onChange={(e) => setProtein(e.target.value)}
          placeholder={t.meals.customFoodProtein}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none" />
        <input type="number" value={fat} onChange={(e) => setFat(e.target.value)}
          placeholder={t.meals.customFoodFat}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none" />
        <input type="number" value={carbs} onChange={(e) => setCarbs(e.target.value)}
          placeholder={t.meals.customFoodCarbs}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none" />
        <input type="number" value={sodium} onChange={(e) => setSodium(e.target.value)}
          placeholder={`${t.meals.sodium} (mg/100g)`}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <input type="text" value={servingName} onChange={(e) => setServingName(e.target.value)}
          placeholder={t.meals.customFoodServingName}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none" />
        <input type="number" value={servingGrams} onChange={(e) => setServingGrams(e.target.value)}
          placeholder={t.meals.customFoodServingGrams}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none" />
      </div>
      <div className="flex gap-2">
        <button onClick={submit} disabled={submitting || !name || !calories}
          className="flex-1 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 transition-colors">
          {t.meals.customFoodSave}
        </button>
        <button onClick={onCancel} className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors">
          {t.meals.customFoodCancel}
        </button>
      </div>
    </div>
  );
}
