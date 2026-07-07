// USDA FoodData Central fetcher
// Uses USDA demo API key - limited to 30 requests/hour
const https = require('https');
const API_KEY = 'DEMO_KEY';

async function fetchUSDA(query, dataType = 'SR Legacy') {
  return new Promise((resolve) => {
    const url = `https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${API_KEY}&query=${encodeURIComponent(query)}&pageSize=1&dataType=${encodeURIComponent(dataType)}`;
    https.get(url, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try {
          const j = JSON.parse(data);
          const f = j.foods?.[0];
          if (!f) { resolve(null); return; }
          const n = {};
          (f.foodNutrients || []).forEach(nut => {
            if (nut.nutrientName === 'Energy') n.energy = nut.value;
            if (nut.nutrientName === 'Protein') n.protein = nut.value;
            if (nut.nutrientName === 'Total lipid (fat)') n.fat = nut.value;
            if (nut.nutrientName === 'Carbohydrate, by difference') n.carbs = nut.value;
          });
          resolve({ name: f.description, ...n });
        } catch { resolve(null); }
      });
    }).on('error', () => resolve(null));
  });
}

const FOODS = [
  { query: 'Rice, white, cooked', name: '쌀밥', category: 'korean', subcategory: 'rice', servings: [{unitName:'공기',gramsPerUnit:210},{unitName:'g',gramsPerUnit:1}] },
  { query: 'Rice, brown, cooked', name: '현미밥', category: 'korean', subcategory: 'rice', servings: [{unitName:'공기',gramsPerUnit:210},{unitName:'g',gramsPerUnit:1}] },
  { query: 'Egg, whole, cooked, fried', name: '계란후라이', category: 'korean', subcategory: 'side', servings: [{unitName:'개',gramsPerUnit:55},{unitName:'g',gramsPerUnit:1}] },
  { query: 'Chicken, breast, roasted', name: '닭가슴살', category: 'korean', subcategory: 'meat', servings: [{unitName:'인분',gramsPerUnit:150},{unitName:'g',gramsPerUnit:1}] },
  { query: 'Tofu, firm', name: '두부', category: 'korean', subcategory: 'side', servings: [{unitName:'모',gramsPerUnit:300},{unitName:'g',gramsPerUnit:1}] },
  { query: 'Beef, short loin, top loin, steak, separable lean only, broiled', name: '스테이크', category: 'western', subcategory: 'meat', servings: [{unitName:'인분',gramsPerUnit:250},{unitName:'g',gramsPerUnit:1}] },
  { query: 'Pork, fresh, belly, raw', name: '삼겹살', category: 'korean', subcategory: 'meat', servings: [{unitName:'인분',gramsPerUnit:200},{unitName:'g',gramsPerUnit:1}] },
  { query: 'Salmon, Atlantic, farmed, raw', name: '연어', category: 'korean', subcategory: 'fish', servings: [{unitName:'인분',gramsPerUnit:150},{unitName:'g',gramsPerUnit:1}] },
  { query: 'Noodles, egg, cooked, enriched', name: '파스타면', category: 'western', subcategory: 'noodle', servings: [{unitName:'접시',gramsPerUnit:200},{unitName:'g',gramsPerUnit:1}] },
  { query: 'Bread, wheat', name: '식빵', category: 'western', subcategory: 'bread', servings: [{unitName:'조각',gramsPerUnit:30},{unitName:'g',gramsPerUnit:1}] },
  { query: 'Potatoes, french fried, all types, salt added', name: '감자튀김', category: 'western', subcategory: 'side', servings: [{unitName:'접시',gramsPerUnit:150},{unitName:'g',gramsPerUnit:1}] },
  { query: 'Bacon, cooked', name: '베이컨', category: 'western', subcategory: 'meat', servings: [{unitName:'조각',gramsPerUnit:20},{unitName:'g',gramsPerUnit:1}] },
  { query: 'Bagel, plain, enriched', name: '베이글', category: 'western', subcategory: 'bread', servings: [{unitName:'개',gramsPerUnit:100},{unitName:'g',gramsPerUnit:1}] },
  { query: 'Pizza, cheese', name: '치즈피자', category: 'western', subcategory: 'bread', servings: [{unitName:'조각',gramsPerUnit:130},{unitName:'g',gramsPerUnit:1}] },
  { query: 'Kimchi', name: '김치', category: 'korean', subcategory: 'side', servings: [{unitName:'접시',gramsPerUnit:80},{unitName:'g',gramsPerUnit:1}] },
  { query: 'Seaweed, dried', name: '김', category: 'korean', subcategory: 'side', servings: [{unitName:'장',gramsPerUnit:3},{unitName:'g',gramsPerUnit:1}] },
  { query: 'Cheese, cheddar', name: '체다치즈', category: 'western', subcategory: 'side', servings: [{unitName:'조각',gramsPerUnit:20},{unitName:'g',gramsPerUnit:1}] },
  { query: 'Yogurt, plain, low fat', name: '플레인요거트', category: 'western', subcategory: 'side', servings: [{unitName:'컵',gramsPerUnit:245},{unitName:'g',gramsPerUnit:1}] },
  { query: 'Milk, whole', name: '우유', category: 'western', subcategory: 'side', servings: [{unitName:'컵',gramsPerUnit:240},{unitName:'ml',gramsPerUnit:1}] },
  { query: 'Banana, raw', name: '바나나', category: 'western', subcategory: 'side', servings: [{unitName:'개',gramsPerUnit:120},{unitName:'g',gramsPerUnit:1}] },
  { query: 'Apple, raw', name: '사과', category: 'western', subcategory: 'side', servings: [{unitName:'개',gramsPerUnit:180},{unitName:'g',gramsPerUnit:1}] },
  { query: 'Soy sauce', name: '간장', category: 'korean', subcategory: 'side', servings: [{unitName:'T',gramsPerUnit:15},{unitName:'ml',gramsPerUnit:1}] },
  { query: 'Butter, salted', name: '버터', category: 'western', subcategory: 'side', servings: [{unitName:'T',gramsPerUnit:14},{unitName:'g',gramsPerUnit:1}] },
  { query: 'Oil, olive', name: '올리브유', category: 'western', subcategory: 'side', servings: [{unitName:'T',gramsPerUnit:14},{unitName:'ml',gramsPerUnit:1}] },
  { query: 'Peanut butter, smooth style', name: '땅콩버터', category: 'western', subcategory: 'side', servings: [{unitName:'T',gramsPerUnit:16},{unitName:'g',gramsPerUnit:1}] },
  { query: 'Honey', name: '꿀', category: 'western', subcategory: 'side', servings: [{unitName:'T',gramsPerUnit:21},{unitName:'g',gramsPerUnit:1}] },
  { query: 'Sugar, granulated', name: '설탕', category: 'western', subcategory: 'side', servings: [{unitName:'T',gramsPerUnit:12},{unitName:'g',gramsPerUnit:1}] },
  { query: 'Chocolate, dark', name: '다크초콜릿', category: 'western', subcategory: 'snack', servings: [{unitName:'조각',gramsPerUnit:10},{unitName:'g',gramsPerUnit:1}] },
  { query: 'Ice cream, vanilla', name: '바닐라아이스크림', category: 'western', subcategory: 'snack', servings: [{unitName:'스쿱',gramsPerUnit:70},{unitName:'g',gramsPerUnit:1}] },
  { query: 'Sweet potato, cooked, baked', name: '고구마', category: 'korean', subcategory: 'side', servings: [{unitName:'개',gramsPerUnit:200},{unitName:'g',gramsPerUnit:1}] },
  { query: 'Corn, sweet, yellow, cooked, boiled', name: '옥수수', category: 'korean', subcategory: 'side', servings: [{unitName:'개',gramsPerUnit:150},{unitName:'g',gramsPerUnit:1}] },
  { query: 'Potatoes, boiled, cooked without skin, flesh', name: '감자', category: 'korean', subcategory: 'side', servings: [{unitName:'개',gramsPerUnit:150},{unitName:'g',gramsPerUnit:1}] },
  { query: 'Onions, raw', name: '양파', category: 'korean', subcategory: 'side', servings: [{unitName:'개',gramsPerUnit:150},{unitName:'g',gramsPerUnit:1}] },
  { query: 'Garlic, raw', name: '마늘', category: 'korean', subcategory: 'side', servings: [{unitName:'쪽',gramsPerUnit:5},{unitName:'g',gramsPerUnit:1}] },
  { query: 'Carrots, raw', name: '당근', category: 'korean', subcategory: 'side', servings: [{unitName:'개',gramsPerUnit:70},{unitName:'g',gramsPerUnit:1}] },
  { query: 'Spinach, raw', name: '시금치', category: 'korean', subcategory: 'side', servings: [{unitName:'접시',gramsPerUnit:80},{unitName:'g',gramsPerUnit:1}] },
  { query: 'Cabbage, raw', name: '양배추', category: 'korean', subcategory: 'side', servings: [{unitName:'접시',gramsPerUnit:100},{unitName:'g',gramsPerUnit:1}] },
]

async function main() {
  const results = [];
  for (const f of FOODS) {
    process.stderr.write(`Fetching: ${f.name}... `);
    const data = await fetchUSDA(f.query);
    if (data && data.energy) {
      results.push({
        ...f,
        caloriesPer100g: Math.round(data.energy * 10) / 10,
        proteinPer100g: Math.round((data.protein || 0) * 10) / 10,
        fatPer100g: Math.round((data.fat || 0) * 10) / 10,
        carbsPer100g: Math.round((data.carbs || 0) * 10) / 10,
        sourceName: data.name,
      });
      process.stderr.write(`✅ ${data.energy}kcal | P:${data.protein}g F:${data.fat}g C:${data.carbs}g\n`);
    } else {
      process.stderr.write(`❌\n`);
    }
    await new Promise(r => setTimeout(r, 200));
  }
  console.log(JSON.stringify(results, null, 2));
  process.stderr.write(`\nDone! ${results.length}/${FOODS.length}\n`);
}

main();
