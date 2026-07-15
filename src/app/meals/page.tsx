"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useT } from "@/lib/LangContext";
import { useToast } from "@/components/Toast";
import { HealthTagBadges } from "@/components/HealthTagBadges";
import { addDaysToKey, toLocalDateKey } from "@/lib/dates";
import { foodDisplayName } from "@/lib/foodLabel";

interface FoodItem {
  id: string;
  name: string;
  nameEn?: string | null;
  category: string;
  caloriesPer100g: number;
  proteinPer100g: number;
  fatPer100g: number;
  carbsPer100g: number;
  sodiumPer100g?: number | null;
  healthTags?: string;
  isCustom?: boolean;
  isFavorite?: boolean;
  servings: { unitName: string; gramsPerUnit: number }[];
}

interface MealItemInput {
  foodId: string;
  foodName: string;
  foodNameEn?: string | null;
  quantity: number;
  unitName: string;
  estCalories?: number;
}

interface MealHistoryItem {
  id: string;
  foodId: string;
  foodName: string;
  foodNameEn?: string | null;
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

const MEAL_TYPES = ["breakfast", "lunch", "dinner", "snack"] as const;

function MealsPageInner() {
  const { t, lang } = useT();
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialDate = searchParams.get("date") || toLocalDateKey();
  const initialType = (searchParams.get("type") as string) || "lunch";

  const [dateKey, setDateKey] = useState(initialDate);
  const [mealType, setMealType] = useState(
    MEAL_TYPES.includes(initialType as (typeof MEAL_TYPES)[number]) ? initialType : "lunch",
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [favorites, setFavorites] = useState<FoodItem[]>([]);
  const [recent, setRecent] = useState<FoodItem[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [unitName, setUnitName] = useState("");
  const [cart, setCart] = useState<MealItemInput[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [editMealId, setEditMealId] = useState<string | null>(null);
  const [showCustomFoodForm, setShowCustomFoodForm] = useState(false);

  const foodLabel = (food: Pick<FoodItem, "name" | "nameEn">) =>
    foodDisplayName({ name: food.name, nameEn: food.nameEn }, lang);

  const cartLabel = (item: Pick<MealItemInput, "foodName" | "foodNameEn">) =>
    foodDisplayName({ name: item.foodName, nameEn: item.foodNameEn }, lang);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (!searchQuery) {
        setFoods([]);
        return;
      }
      setSearching(true);
      try {
        const res = await fetch(`/api/foods?q=${encodeURIComponent(searchQuery)}`);
        if (res.ok) setFoods(await res.json());
      } catch {
        setFoods([]);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    (async () => {
      const [fRes, rRes] = await Promise.all([
        fetch("/api/foods?favorites=1"),
        fetch("/api/foods?recent=1"),
      ]);
      if (fRes.ok) setFavorites(await fRes.json());
      if (rRes.ok) setRecent(await rRes.json());
    })();
  }, []);

  const estimateCalories = (food: FoodItem, qty: number, unit: string) => {
    const serving = food.servings.find((s) => s.unitName === unit) || food.servings[0];
    if (!serving) return 0;
    return Math.round(food.caloriesPer100g * ((qty * serving.gramsPerUnit) / 100));
  };

  const selectFood = (food: FoodItem) => {
    setSelectedFood(food);
    setUnitName(food.servings[1]?.unitName || food.servings[0]?.unitName || "g");
    setQuantity(1);
  };

  const addToCart = () => {
    if (!selectedFood || !unitName || quantity <= 0) return;
    setCart((prev) => [
      ...prev,
      {
        foodId: selectedFood.id,
        foodName: selectedFood.name,
        foodNameEn: selectedFood.nameEn ?? null,
        quantity,
        unitName,
        estCalories: estimateCalories(selectedFood, quantity, unitName),
      },
    ]);
    setSelectedFood(null);
    setQuantity(1);
    setUnitName("");
    setSearchQuery("");
  };

  const removeFromCart = (index: number) => {
    setCart((prev) => prev.filter((_, i) => i !== index));
  };

  const cancelEdit = () => {
    setCart([]);
    setEditMealId(null);
  };

  const cartTotal = useMemo(
    () => cart.reduce((s, i) => s + (i.estCalories ?? 0), 0),
    [cart],
  );

  const submitMeal = async () => {
    if (cart.length === 0) return;
    setSubmitting(true);
    const url = editMealId ? `/api/meals/${editMealId}` : "/api/meals";
    const method = editMealId ? "PUT" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mealType,
        date: dateKey,
        items: cart.map(({ foodId, quantity, unitName }) => ({ foodId, quantity, unitName })),
      }),
    });
    setSubmitting(false);
    if (res.ok) {
      setCart([]);
      setEditMealId(null);
      toast(editMealId ? t.meals.updated : t.meals.recorded);
      router.refresh();
      // reload history
      window.dispatchEvent(new Event("meals-updated"));
    } else {
      const data = await res.json().catch(() => ({}));
      toast(data.error || t.common.error, "error");
    }
  };

  const toggleFavorite = async (food: FoodItem) => {
    if (food.isFavorite) {
      await fetch(`/api/favorites?foodId=${food.id}`, { method: "DELETE" });
      setFavorites((prev) => prev.filter((f) => f.id !== food.id));
      setFoods((prev) => prev.map((f) => (f.id === food.id ? { ...f, isFavorite: false } : f)));
    } else {
      await fetch("/api/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ foodId: food.id }),
      });
      setFavorites((prev) => [...prev, { ...food, isFavorite: true }]);
      setFoods((prev) => prev.map((f) => (f.id === food.id ? { ...f, isFavorite: true } : f)));
    }
  };

  const copyYesterday = async () => {
    const y = addDaysToKey(dateKey, -1);
    const res = await fetch(`/api/meals?date=${y}`);
    if (!res.ok) return;
    const meals: MealHistoryEntry[] = await res.json();
    const match = meals.find((m) => m.mealType === mealType);
    if (!match || !match.items?.length) {
      toast(t.meals.noYesterday, "info");
      return;
    }
    setCart(
      match.items.map((item) => ({
        foodId: item.foodId,
        foodName: item.foodName,
        foodNameEn: item.foodNameEn ?? null,
        quantity: item.quantity,
        unitName: item.unitName,
        estCalories: item.totalCalories,
      })),
    );
    toast(t.meals.copied);
  };

  const mealLabel = (mt: string) => {
    const map: Record<string, string> = {
      breakfast: t.meals.breakfast,
      lunch: t.meals.lunch,
      dinner: t.meals.dinner,
      snack: t.meals.snack,
    };
    return map[mt] || mt;
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">{t.meals.title}</h1>

      <div className="card p-4 mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {t.meals.date}
        </label>
        <input
          type="date"
          value={dateKey}
          onChange={(e) => setDateKey(e.target.value)}
          className="input-field"
        />
      </div>

      <div className="card p-5 mb-4">
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {t.meals.mealType}
          </label>
          <button
            type="button"
            onClick={copyYesterday}
            className="text-xs font-medium text-emerald-600 hover:underline"
          >
            {t.meals.copyYesterday}
          </button>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {MEAL_TYPES.map((mt) => (
            <button
              key={mt}
              onClick={() => setMealType(mt)}
              className={`py-2 px-2 rounded-lg text-sm font-medium transition-colors ${
                mealType === mt
                  ? "bg-emerald-600 text-white"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
            >
              {mealLabel(mt)}
            </button>
          ))}
        </div>
      </div>

      {(favorites.length > 0 || recent.length > 0) && !selectedFood && !searchQuery && (
        <div className="card p-4 mb-4 space-y-3">
          {favorites.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold mb-2">
                {t.meals.favorites} ({favorites.length})
              </h3>
              <select
                value=""
                onChange={(e) => {
                  const food = favorites.find((f) => f.id === e.target.value);
                  if (food) selectFood(food);
                }}
                className="input-field"
              >
                <option value="" disabled>
                  {t.meals.favorites}
                </option>
                {favorites.map((f) => (
                  <option key={f.id} value={f.id}>
                    {foodLabel(f)}
                  </option>
                ))}
              </select>
            </div>
          )}
          {recent.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold mb-2">{t.meals.recent}</h3>
              <div className="flex flex-wrap gap-2">
                {recent.slice(0, 8).map((f) => (
                  <button
                    key={f.id}
                    onClick={() => selectFood(f)}
                    className="text-xs px-2.5 py-1.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200"
                  >
                    {foodLabel(f)}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="card p-5 mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {t.meals.search}
        </label>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t.meals.searchPlaceholder}
          className="input-field mb-3"
        />

        {searching && !selectedFood && (
          <p className="text-sm text-gray-400 dark:text-gray-500 py-2">{t.meals.searching}</p>
        )}

        {!searching && foods.length > 0 && !selectedFood && (
          <ul className="max-h-56 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg divide-y dark:divide-gray-700">
            {foods.map((food) => (
              <li
                key={food.id}
                className="px-3 py-3 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 flex justify-between items-center gap-2"
              >
                <button
                  type="button"
                  onClick={() => selectFood(food)}
                  className="flex-1 text-left min-w-0"
                >
                  <span className="font-medium text-gray-800 dark:text-gray-200">
                    {foodLabel(food)}
                  </span>
                  {food.isCustom && (
                    <span className="ml-1 text-[10px] text-emerald-600">{t.meals.privateFood}</span>
                  )}
                  <span className="ml-1.5 inline-flex">
                    <HealthTagBadges tags={food.healthTags} size="xs" />
                  </span>
                  <div className="text-xs text-gray-400">{food.caloriesPer100g}kcal/100g</div>
                </button>
                <button
                  type="button"
                  onClick={() => toggleFavorite(food)}
                  className="text-lg px-2"
                  aria-label={food.isFavorite ? t.meals.unstar : t.meals.star}
                >
                  {food.isFavorite ? "★" : "☆"}
                </button>
              </li>
            ))}
          </ul>
        )}

        {!searching && foods.length === 0 && searchQuery && !selectedFood && (
          <div className="py-3 text-center">
            <p className="text-sm text-gray-400 dark:text-gray-500 mb-2">{t.meals.noResults}</p>
            <button
              onClick={() => setShowCustomFoodForm(true)}
              className="text-xs text-emerald-600 hover:underline font-medium"
            >
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
              selectFood(food);
            }}
          />
        )}

        {selectedFood && (
          <div className="mt-3 p-4 bg-emerald-50 dark:bg-emerald-950/40 rounded-lg">
            <div className="flex justify-between mb-2">
              <div>
                <span className="font-semibold text-gray-900 dark:text-gray-100">
                  {foodLabel(selectedFood)}
                </span>
                <span className="ml-1.5">
                  <HealthTagBadges tags={selectedFood.healthTags} size="xs" />
                </span>
              </div>
              <button
                onClick={() => setSelectedFood(null)}
                className="text-gray-400 hover:text-gray-600"
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-3">
              P: {selectedFood.proteinPer100g}g | F: {selectedFood.fatPer100g}g | C:{" "}
              {selectedFood.carbsPer100g}g
              {selectedFood.sodiumPer100g != null &&
                ` | ${t.meals.sodium}: ${selectedFood.sodiumPer100g}mg`}{" "}
              (per 100g)
            </div>
            <div className="text-xs text-gray-500 mb-1">{t.meals.quickQty}</div>
            <div className="flex gap-1 mb-2">
              {[0.5, 1, 1.5, 2].map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => setQuantity(q)}
                  className={`px-2.5 py-1 text-xs rounded-md border ${
                    quantity === q
                      ? "border-emerald-600 bg-emerald-600 text-white"
                      : "border-gray-300 dark:border-gray-600"
                  }`}
                >
                  {q}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="number"
                value={quantity || ""}
                onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
                min={0.1}
                step={0.5}
                className="input-field w-20"
                placeholder="Qty"
              />
              <select
                value={unitName}
                onChange={(e) => setUnitName(e.target.value)}
                className="input-field flex-1"
              >
                {selectedFood.servings.map((s) => (
                  <option key={s.unitName} value={s.unitName}>
                    {s.unitName} ({s.gramsPerUnit}g)
                  </option>
                ))}
              </select>
              <button
                onClick={addToCart}
                disabled={quantity <= 0 || !unitName}
                className="btn-primary px-4"
              >
                {t.meals.add}
              </button>
            </div>
            <p className="text-[11px] text-gray-400 mt-2" title={t.health.disclaimer}>
              {t.common.estimateNote}
            </p>
          </div>
        )}
      </div>

      {(cart.length > 0 || editMealId) && (
        <div className="card p-5 mb-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">{t.meals.cart}</h3>
            <span className="text-sm font-medium text-emerald-600">
              {t.meals.cartTotal}: ~{cartTotal} kcal
            </span>
          </div>
          {cart.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-gray-500 py-2">{t.meals.empty}</p>
          ) : (
            <ul className="space-y-2">
              {cart.map((item, i) => (
                <li
                  key={i}
                  className="flex justify-between items-center text-sm py-2 border-b border-gray-100 dark:border-gray-700 last:border-0"
                >
                  <span className="text-gray-700 dark:text-gray-300">{cartLabel(item)}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400 dark:text-gray-500">
                      {item.quantity}
                      {item.unitName}
                      {item.estCalories != null && ` · ${item.estCalories}kcal`}
                    </span>
                    <button
                      onClick={() => removeFromCart(i)}
                      className="text-red-400 hover:text-red-600 text-xs p-1.5 -m-1.5"
                    >
                      {t.meals.remove}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-4 flex gap-2">
            {editMealId && (
              <button
                onClick={cancelEdit}
                disabled={submitting}
                className="btn-secondary"
              >
                {t.common.cancel}
              </button>
            )}
            <button
              onClick={submitMeal}
              disabled={submitting || cart.length === 0}
              className="flex-1 btn-primary"
            >
              {submitting ? t.meals.saving : editMealId ? t.meals.edit : t.meals.submit}
            </button>
          </div>
        </div>
      )}

      <MealHistory
        dateKey={dateKey}
        onEdit={(meal: MealHistoryEntry) => {
          setMealType(meal.mealType);
          setCart(
            meal.items.map((item) => ({
              foodId: item.foodId,
              foodName: item.foodName,
              foodNameEn: item.foodNameEn ?? null,
              quantity: item.quantity,
              unitName: item.unitName,
              estCalories: item.totalCalories,
            })),
          );
          setEditMealId(meal.id);
        }}
      />
    </div>
  );
}

function MealHistory({
  dateKey,
  onEdit,
}: {
  dateKey: string;
  onEdit: (meal: MealHistoryEntry) => void;
}) {
  const { t, lang } = useT();
  const { toast } = useToast();
  const [meals, setMeals] = useState<MealHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const historyFoodLabel = (item: Pick<MealHistoryItem, "foodName" | "foodNameEn">) =>
    foodDisplayName({ name: item.foodName, nameEn: item.foodNameEn }, lang);

  const fetchMeals = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/meals?date=${dateKey}`);
    if (res.ok) setMeals(await res.json());
    setLoading(false);
  }, [dateKey]);

  useEffect(() => {
    fetchMeals();
    const handler = () => fetchMeals();
    window.addEventListener("meals-updated", handler);
    return () => window.removeEventListener("meals-updated", handler);
  }, [fetchMeals]);

  const deleteMeal = async (id: string) => {
    if (!confirm(t.meals.confirmDelete)) return;
    await fetch(`/api/meals/${id}`, { method: "DELETE" });
    setMeals((prev) => prev.filter((m) => m.id !== id));
    toast(t.common.success);
    router.refresh();
  };

  const deleteItem = async (mealId: string, itemId: string) => {
    if (!confirm(t.meals.confirmDelete)) return;
    await fetch(`/api/meals/${mealId}/items/${itemId}`, { method: "DELETE" });
    await fetchMeals();
    router.refresh();
  };

  const mealLabel = (mt: string) => {
    const map: Record<string, string> = {
      breakfast: t.meals.breakfast,
      lunch: t.meals.lunch,
      dinner: t.meals.dinner,
      snack: t.meals.snack,
    };
    return map[mt] || mt;
  };

  if (loading) {
    return (
      <div className="card p-5">
        <p className="text-sm text-gray-400">{t.common.loading}</p>
      </div>
    );
  }

  return (
    <div className="card p-5">
      <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">{t.meals.today}</h3>
      {meals.length === 0 ? (
        <p className="text-sm text-gray-400 dark:text-gray-500">{t.meals.empty}</p>
      ) : (
        <div className="space-y-3">
          {meals.map((meal) => (
            <div
              key={meal.id}
              className="flex items-start justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg gap-2"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-800 dark:text-gray-200">
                    {mealLabel(meal.mealType)}
                  </span>
                  <span className="text-emerald-600 font-medium">
                    {Math.round(meal.totalCalories)} kcal
                  </span>
                </div>
                <div className="text-xs text-gray-400 dark:text-gray-500 mt-1 space-y-1">
                  {meal.items?.map((item) => (
                    <div key={item.id} className="flex items-center flex-wrap gap-1">
                      <span>
                        {historyFoodLabel(item)} {item.quantity}
                        {item.unitName}
                      </span>
                      <HealthTagBadges tags={item.healthTags} size="xs" />
                      <button
                        onClick={() => deleteItem(meal.id, item.id)}
                        title={t.meals.deleteBtn}
                        className="text-gray-300 dark:text-gray-600 hover:text-red-500 p-1.5 -m-1.5"
                        aria-label={t.meals.deleteBtn}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex gap-1 shrink-0">
                <button
                  onClick={() => onEdit(meal)}
                  className="px-3 py-2 text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 rounded hover:bg-blue-200"
                >
                  {t.meals.editBtn}
                </button>
                <button
                  onClick={() => deleteMeal(meal.id)}
                  className="px-3 py-2 text-xs bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded hover:bg-red-200"
                >
                  {t.meals.deleteBtn}
                </button>
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
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder={t.meals.customFoodName}
        className="input-field"
      />
      <div className="grid grid-cols-2 gap-2">
        <input
          type="number"
          value={calories}
          onChange={(e) => setCalories(e.target.value)}
          placeholder={t.meals.customFoodCalories}
          className="input-field"
        />
        <input
          type="number"
          value={protein}
          onChange={(e) => setProtein(e.target.value)}
          placeholder={t.meals.customFoodProtein}
          className="input-field"
        />
        <input
          type="number"
          value={fat}
          onChange={(e) => setFat(e.target.value)}
          placeholder={t.meals.customFoodFat}
          className="input-field"
        />
        <input
          type="number"
          value={carbs}
          onChange={(e) => setCarbs(e.target.value)}
          placeholder={t.meals.customFoodCarbs}
          className="input-field"
        />
        <input
          type="number"
          value={sodium}
          onChange={(e) => setSodium(e.target.value)}
          placeholder={`${t.meals.sodium} (mg/100g)`}
          className="input-field"
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <input
          type="text"
          value={servingName}
          onChange={(e) => setServingName(e.target.value)}
          placeholder={t.meals.customFoodServingName}
          className="input-field"
        />
        <input
          type="number"
          value={servingGrams}
          onChange={(e) => setServingGrams(e.target.value)}
          placeholder={t.meals.customFoodServingGrams}
          className="input-field"
        />
      </div>
      <div className="flex gap-2">
        <button
          onClick={submit}
          disabled={submitting || !name || !calories}
          className="flex-1 btn-primary"
        >
          {t.meals.customFoodSave}
        </button>
        <button onClick={onCancel} className="btn-secondary">
          {t.meals.customFoodCancel}
        </button>
      </div>
    </div>
  );
}

export default function MealsPage() {
  return (
    <Suspense fallback={<div className="text-center py-20 text-gray-400">...</div>}>
      <MealsPageInner />
    </Suspense>
  );
}
