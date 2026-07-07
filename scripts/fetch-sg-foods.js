// Fetch Singaporean foods from OpenFoodFacts
const https = require('https');

// Track 2: Manually curated Singapore hawker food nutrition data
// Sources: HPB Singapore guidelines, nutrition research papers, MOH estimates
const HAWKER_FOODS = [
  // --- Chicken Rice ---
  { name: '치킨라이스', nameEn: 'Hainanese Chicken Rice', category: 'singapore', subcategory: 'rice', cal: 165, protein: 9.5, fat: 7.8, carbs: 14, servings: [{unitName:'접시',gramsPerUnit:380},{unitName:'g',gramsPerUnit:1}] },
  { name: '치킨라이스_구운', nameEn: 'Roasted Chicken Rice', category: 'singapore', subcategory: 'rice', cal: 170, protein: 10, fat: 8.2, carbs: 14, servings: [{unitName:'접시',gramsPerUnit:380},{unitName:'g',gramsPerUnit:1}] },
  
  // --- Noodles ---
  { name: '락사', nameEn: 'Laksa', category: 'singapore', subcategory: 'noodle', cal: 135, protein: 7, fat: 9, carbs: 8, servings: [{unitName:'그릇',gramsPerUnit:450},{unitName:'g',gramsPerUnit:1}] },
  { name: '프라운누들', nameEn: 'Prawn Noodles (Hae Mee)', category: 'singapore', subcategory: 'noodle', cal: 90, protein: 6, fat: 3, carbs: 11, servings: [{unitName:'그릇',gramsPerUnit:450},{unitName:'g',gramsPerUnit:1}] },
  { name: '차퀘티아우', nameEn: 'Char Kway Teow', category: 'singapore', subcategory: 'noodle', cal: 180, protein: 5, fat: 10, carbs: 18, servings: [{unitName:'접시',gramsPerUnit:350},{unitName:'g',gramsPerUnit:1}] },
  { name: '호키엔미', nameEn: 'Hokkien Mee', category: 'singapore', subcategory: 'noodle', cal: 160, protein: 6, fat: 8, carbs: 16, servings: [{unitName:'접시',gramsPerUnit:380},{unitName:'g',gramsPerUnit:1}] },
  { name: '완턴미', nameEn: 'Wanton Mee', category: 'singapore', subcategory: 'noodle', cal: 145, protein: 7, fat: 5, carbs: 18, servings: [{unitName:'접시',gramsPerUnit:350},{unitName:'g',gramsPerUnit:1}] },
  { name: '피쉬볼누들', nameEn: 'Fishball Noodles', category: 'singapore', subcategory: 'noodle', cal: 100, protein: 5, fat: 2, carbs: 15, servings: [{unitName:'그릇',gramsPerUnit:400},{unitName:'g',gramsPerUnit:1}] },
  { name: '비훈', nameEn: 'Bee Hoon (Fried Vermicelli)', category: 'singapore', subcategory: 'noodle', cal: 155, protein: 4, fat: 7, carbs: 19, servings: [{unitName:'접시',gramsPerUnit:300},{unitName:'g',gramsPerUnit:1}] },
  { name: '미고렝', nameEn: 'Mee Goreng', category: 'singapore', subcategory: 'noodle', cal: 170, protein: 5, fat: 8, carbs: 20, servings: [{unitName:'접시',gramsPerUnit:350},{unitName:'g',gramsPerUnit:1}] },
  { name: '미시아ム', nameEn: 'Mee Siam', category: 'singapore', subcategory: 'noodle', cal: 130, protein: 4, fat: 5, carbs: 17, servings: [{unitName:'접시',gramsPerUnit:320},{unitName:'g',gramsPerUnit:1}] },

  // --- Rice Dishes ---
  { name: '나시르막', nameEn: 'Nasi Lemak', category: 'singapore', subcategory: 'rice', cal: 220, protein: 8, fat: 14, carbs: 16, servings: [{unitName:'접시',gramsPerUnit:350},{unitName:'g',gramsPerUnit:1}] },
  { name: '나시브리아니', nameEn: 'Nasi Briyani', category: 'singapore', subcategory: 'rice', cal: 180, protein: 10, fat: 7, carbs: 20, servings: [{unitName:'접시',gramsPerUnit:400},{unitName:'g',gramsPerUnit:1}] },
  { name: '클레이팟라이스', nameEn: 'Claypot Rice', category: 'singapore', subcategory: 'rice', cal: 175, protein: 8, fat: 6, carbs: 22, servings: [{unitName:'그릇',gramsPerUnit:420},{unitName:'g',gramsPerUnit:1}] },
  { name: '경제적라이스', nameEn: 'Economic Rice (Cai Png)', category: 'singapore', subcategory: 'rice', cal: 160, protein: 7, fat: 6, carbs: 20, servings: [{unitName:'접시',gramsPerUnit:400},{unitName:'g',gramsPerUnit:1}] },

  // --- Soup / Broth ---
  { name: '바쿠테', nameEn: 'Bak Kut Teh', category: 'singapore', subcategory: 'soup', cal: 80, protein: 9, fat: 5, carbs: 1, servings: [{unitName:'그릇',gramsPerUnit:400},{unitName:'g',gramsPerUnit:1}] },
  { name: '피쉬헤드커리', nameEn: 'Fish Head Curry', category: 'singapore', subcategory: 'soup', cal: 110, protein: 8, fat: 7, carbs: 4, servings: [{unitName:'그릇',gramsPerUnit:450},{unitName:'g',gramsPerUnit:1}] },

  // --- Meat / Seafood ---
  { name: '사테', nameEn: 'Satay (Chicken/Beef)', category: 'singapore', subcategory: 'meat', cal: 190, protein: 18, fat: 10, carbs: 7, servings: [{unitName:'꼬치',gramsPerUnit:80},{unitName:'인분',gramsPerUnit:200},{unitName:'g',gramsPerUnit:1}] },
  { name: '치킨윙_하커', nameEn: 'BBQ Chicken Wings', category: 'singapore', subcategory: 'meat', cal: 230, protein: 18, fat: 14, carbs: 6, servings: [{unitName:'개',gramsPerUnit:80},{unitName:'g',gramsPerUnit:1}] },
  { name: '삼발스팅레이', nameEn: 'Sambal Stingray', category: 'singapore', subcategory: 'fish', cal: 140, protein: 16, fat: 6, carbs: 5, servings: [{unitName:'인분',gramsPerUnit:200},{unitName:'g',gramsPerUnit:1}] },
  { name: '칠리크랩', nameEn: 'Chilli Crab', category: 'singapore', subcategory: 'fish', cal: 120, protein: 12, fat: 5, carbs: 7, servings: [{unitName:'인분',gramsPerUnit:300},{unitName:'g',gramsPerUnit:1}] },
  { name: '블랙페퍼크랩', nameEn: 'Black Pepper Crab', category: 'singapore', subcategory: 'fish', cal: 125, protein: 12, fat: 5.5, carbs: 7, servings: [{unitName:'인분',gramsPerUnit:300},{unitName:'g',gramsPerUnit:1}] },

  // --- Snacks / Sides ---
  { name: '로작', nameEn: 'Rojak', category: 'singapore', subcategory: 'snack', cal: 95, protein: 2, fat: 3, carbs: 15, servings: [{unitName:'접시',gramsPerUnit:200},{unitName:'g',gramsPerUnit:1}] },
  { name: '팝이야', nameEn: 'Popiah', category: 'singapore', subcategory: 'snack', cal: 110, protein: 3, fat: 3, carbs: 17, servings: [{unitName:'개',gramsPerUnit:120},{unitName:'g',gramsPerUnit:1}] },
  { name: '춘권', nameEn: 'Spring Roll (Ngoh Hiang)', category: 'singapore', subcategory: 'snack', cal: 160, protein: 6, fat: 9, carbs: 14, servings: [{unitName:'개',gramsPerUnit:60},{unitName:'g',gramsPerUnit:1}] },
  { name: '카야토스트', nameEn: 'Kaya Toast', category: 'singapore', subcategory: 'bread', cal: 280, protein: 6, fat: 10, carbs: 42, servings: [{unitName:'세트',gramsPerUnit:80},{unitName:'g',gramsPerUnit:1}] },
  { name: '오타', nameEn: 'Otah (Otak-otak)', category: 'singapore', subcategory: 'snack', cal: 155, protein: 10, fat: 10, carbs: 6, servings: [{unitName:'개',gramsPerUnit:60},{unitName:'g',gramsPerUnit:1}] },
  { name: '츄에꾸에', nameEn: 'Chwee Kueh', category: 'singapore', subcategory: 'snack', cal: 90, protein: 1, fat: 2, carbs: 17, servings: [{unitName:'개',gramsPerUnit:50},{unitName:'g',gramsPerUnit:1}] },
  { name: '캐럿케이크', nameEn: 'Carrot Cake (Chai Tow Kway)', category: 'singapore', subcategory: 'snack', cal: 175, protein: 3, fat: 9, carbs: 21, servings: [{unitName:'접시',gramsPerUnit:250},{unitName:'g',gramsPerUnit:1}] },

  // --- Drinks ---
  { name: '테타릭', nameEn: 'Teh Tarik', category: 'singapore', subcategory: 'side', cal: 55, protein: 1, fat: 1.5, carbs: 9, servings: [{unitName:'컵',gramsPerUnit:250},{unitName:'ml',gramsPerUnit:1}] },
  { name: '코피', nameEn: 'Kopi (Singapore Coffee)', category: 'singapore', subcategory: 'side', cal: 45, protein: 0.5, fat: 0.5, carbs: 9, servings: [{unitName:'컵',gramsPerUnit:200},{unitName:'ml',gramsPerUnit:1}] },
  { name: '반단주스', nameEn: 'Bandung', category: 'singapore', subcategory: 'side', cal: 70, protein: 0.5, fat: 1, carbs: 15, servings: [{unitName:'컵',gramsPerUnit:300},{unitName:'ml',gramsPerUnit:1}] },
  { name: '슈가케인주스', nameEn: 'Sugarcane Juice', category: 'singapore', subcategory: 'side', cal: 65, protein: 0.2, fat: 0, carbs: 16, servings: [{unitName:'컵',gramsPerUnit:300},{unitName:'ml',gramsPerUnit:1}] },

  // --- Desserts ---
  { name: '아이스카창', nameEn: 'Ice Kacang', category: 'singapore', subcategory: 'snack', cal: 85, protein: 1, fat: 2, carbs: 16, servings: [{unitName:'그릇',gramsPerUnit:300},{unitName:'g',gramsPerUnit:1}] },
  { name: '첸돌', nameEn: 'Chendol', category: 'singapore', subcategory: 'snack', cal: 90, protein: 1, fat: 4, carbs: 13, servings: [{unitName:'그릇',gramsPerUnit:280},{unitName:'g',gramsPerUnit:1}] },
  { name: '풋살롱', nameEn: 'Pulut Hitam', category: 'singapore', subcategory: 'snack', cal: 120, protein: 2, fat: 3, carbs: 22, servings: [{unitName:'그릇',gramsPerUnit:250},{unitName:'g',gramsPerUnit:1}] },
  { name: '타우수안', nameEn: 'Tau Suan', category: 'singapore', subcategory: 'snack', cal: 100, protein: 2, fat: 1, carbs: 21, servings: [{unitName:'그릇',gramsPerUnit:250},{unitName:'g',gramsPerUnit:1}] },
];

// Track 1: Fetch Singaporean packaged foods from OpenFoodFacts
const SG_QUERIES = [
  'yeos', 'pokka singapore', 'tiger beer singapore', 'milo singapore',
  'prima taste singapore', 'irvins singapore', 'koka noodles singapore',
  'f&n singapore', 'yakun singapore', 'old chang kee',
  'bee cheng hiang', 'killiney', 'bengawan solo', 'laksa paste singapore',
  'chicken rice paste', 'sambal singapore', 'kaya singapore',
  'hainanese chicken rice paste', 'chilli crab paste', 'bak kut teh spice',
];

async function fetchOFF(query) {
  return new Promise((resolve) => {
    const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&json=1&page_size=3&sort_by=unique_scans_n&countries_tags=sg`;
    https.get(url, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try {
          const j = JSON.parse(d);
          const results = [];
          for (const p of (j.products || []).slice(0, 3)) {
            const n = p.nutriments || {};
            if (n['energy-kcal_100g'] && n['energy-kcal_100g'] > 0) {
              results.push({
                name: (p.product_name || 'Unknown').substring(0, 50),
                category: 'singapore',
                subcategory: 'snack',
                caloriesPer100g: Math.round(n['energy-kcal_100g'] * 10) / 10,
                proteinPer100g: Math.round((n.proteins_100g || 0) * 10) / 10,
                fatPer100g: Math.round((n.fat_100g || 0) * 10) / 10,
                carbsPer100g: Math.round((n.carbohydrates_100g || 0) * 10) / 10,
              });
            }
          }
          resolve(results);
        } catch { resolve([]); }
      });
    }).on('error', () => resolve([]));
  });
}

async function main() {
  const allFoods = [...HAWKER_FOODS];
  
  console.error(`Hawker foods: ${HAWKER_FOODS.length}`);
  
  for (const q of SG_QUERIES) {
    process.stderr.write(`Fetching OFF: ${q}... `);
    const results = await fetchOFF(q);
    process.stderr.write(`${results.length} found\n`);
    for (const r of results) {
      // Add servings
      allFoods.push({
        ...r,
        servings: [{ unitName: 'g', gramsPerUnit: 1 }],
      });
    }
    await new Promise(r => setTimeout(r, 300));
  }
  
  console.log(JSON.stringify(allFoods, null, 2));
  process.stderr.write(`\nTotal: ${allFoods.length} foods (${HAWKER_FOODS.length} hawker + ${allFoods.length - HAWKER_FOODS.length} packaged)\n`);
}

main();
