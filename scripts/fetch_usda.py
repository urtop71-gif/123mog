import urllib.request, urllib.parse, json, time, sys

API_KEY = "DEMO_KEY"
DATA_TYPE = "SR Legacy"

def fetch_usda(query):
    url = f"https://api.nal.usda.gov/fdc/v1/foods/search?api_key={API_KEY}&query={urllib.parse.quote(query)}&pageSize=1&dataType={DATA_TYPE}"
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "DietTracker/1.0"})
        with urllib.request.urlopen(req, timeout=15) as resp:
            data = json.loads(resp.read())
        food = data.get("foods", [None])[0]
        if not food:
            return None
        nutrients = {}
        for n in food.get("foodNutrients", []):
            name = n.get("nutrientName", "")
            if "Energy" in name: nutrients["energy"] = n["value"]
            if name == "Protein": nutrients["protein"] = n["value"]
            if "Total lipid (fat)" in name: nutrients["fat"] = n["value"]
            if "Carbohydrate" in name: nutrients["carbs"] = n["value"]
        if not nutrients.get("energy"):
            return None
        return {
            "usda_name": food.get("description", ""),
            "energy": round(nutrients.get("energy", 0), 1),
            "protein": round(nutrients.get("protein", 0), 1),
            "fat": round(nutrients.get("fat", 0), 1),
            "carbs": round(nutrients.get("carbs", 0), 1),
        }
    except Exception as e:
        return {"error": str(e)}

FOODS = [
    ("Rice, white, cooked, no salt", "쌀밥", "korean", "rice"),
    ("Chicken, breast, roasted, skinless", "닭가슴살", "korean", "meat"),
    ("Egg, whole, cooked, fried", "계란후라이", "korean", "side"),
    ("Beef, ground, 85% lean, broiled", "소고기다짐육", "korean", "meat"),
    ("Salmon, Atlantic, farmed, cooked", "연어구이", "korean", "fish"),
    ("Tofu, raw, firm, prepared with calcium sulfate", "두부", "korean", "side"),
    ("Pork, fresh, belly, raw", "삼겹살", "korean", "meat"),
    ("Noodles, egg, cooked, enriched", "파스타면", "western", "noodle"),
    ("Bread, wheat", "식빵", "western", "bread"),
    ("Potatoes, french fried, salt added, frozen", "감자튀김", "western", "side"),
    ("Bacon, cooked", "베이컨", "western", "meat"),
    ("Bagels, plain, enriched", "베이글", "western", "bread"),
    ("Pizza, cheese, regular", "치즈피자", "western", "bread"),
    ("Cheese, cheddar", "체다치즈", "western", "side"),
    ("Yogurt, plain, low fat", "플레인요거트", "western", "side"),
    ("Milk, whole, 3.25% milkfat", "우유", "western", "side"),
    ("Bananas, raw", "바나나", "western", "side"),
    ("Apples, raw", "사과", "western", "side"),
    ("Sweet potato, cooked, baked in skin", "고구마", "korean", "side"),
    ("Corn, sweet, yellow, cooked, boiled", "옥수수", "korean", "side"),
    ("Potatoes, boiled, cooked without skin, flesh", "감자", "korean", "side"),
    ("Onions, raw", "양파", "korean", "side"),
    ("Garlic, raw", "마늘", "korean", "side"),
    ("Carrots, raw", "당근", "korean", "side"),
    ("Spinach, raw", "시금치", "korean", "side"),
    ("Cabbage, raw", "양배추", "korean", "side"),
    ("Butter, salted", "버터", "western", "side"),
    ("Oil, olive, salad or cooking", "올리브유", "western", "side"),
    ("Honey", "꿀", "western", "side"),
    ("Sugars, granulated", "설탕", "western", "side"),
    ("Ice creams, vanilla", "바닐라아이스크림", "western", "snack"),
    ("Peanut butter, smooth style", "땅콩버터", "western", "side"),
]

results = []
errors = []
for query, name, cat, subcat in FOODS:
    sys.stderr.write(f"Fetching {name}... ")
    sys.stderr.flush()
    data = fetch_usda(query)
    if data and "error" not in data:
        results.append({
            "name": name, "category": cat, "subcategory": subcat,
            "caloriesPer100g": data["energy"],
            "proteinPer100g": data["protein"],
            "fatPer100g": data["fat"],
            "carbsPer100g": data["carbs"],
            "source": f"USDA: {data['usda_name']}",
        })
        sys.stderr.write(f"✅ {data['energy']}kcal\n")
    else:
        errors.append(name)
        sys.stderr.write(f"❌ {data.get('error', 'no data') if isinstance(data, dict) else 'no data'}\n")
    time.sleep(0.3)  # Rate limiting

print(json.dumps(results, indent=2, ensure_ascii=False))
sys.stderr.write(f"\n✅ {len(results)}/{len(FOODS)} fetched, ❌ {len(errors)} failed\n")
if errors:
    sys.stderr.write(f"Failed: {errors}\n")
