// OpenFoodFacts fetcher - builds accurate seed data
const https = require('https');

const FOODS_TO_SEARCH = [
  // === KOREAN ===
  { query: 'steamed rice', name: '쌀밥', category: 'korean', subcategory: 'rice', servings: [{ unitName: '공기', gramsPerUnit: 210 }, { unitName: 'g', gramsPerUnit: 1 }] },
  { query: 'kimchi', name: '김치', category: 'korean', subcategory: 'side', servings: [{ unitName: '접시', gramsPerUnit: 80 }, { unitName: 'g', gramsPerUnit: 1 }] },
  { query: 'bulgogi', name: '불고기', category: 'korean', subcategory: 'meat', servings: [{ unitName: '인분', gramsPerUnit: 200 }, { unitName: 'g', gramsPerUnit: 1 }] },
  { query: 'chicken breast', name: '닭가슴살', category: 'korean', subcategory: 'meat', servings: [{ unitName: '인분', gramsPerUnit: 150 }, { unitName: 'g', gramsPerUnit: 1 }] },
  { query: 'tofu', name: '두부', category: 'korean', subcategory: 'side', servings: [{ unitName: '모', gramsPerUnit: 300 }, { unitName: 'g', gramsPerUnit: 1 }] },
  { query: 'egg fried', name: '계란후라이', category: 'korean', subcategory: 'side', servings: [{ unitName: '개', gramsPerUnit: 55 }, { unitName: 'g', gramsPerUnit: 1 }] },
  { query: 'ramen noodles', name: '라면', category: 'korean', subcategory: 'noodle', servings: [{ unitName: '그릇', gramsPerUnit: 500 }, { unitName: 'g', gramsPerUnit: 1 }] },
  { query: 'tteokbokki', name: '떡볶이', category: 'korean', subcategory: 'snack', servings: [{ unitName: '접시', gramsPerUnit: 350 }, { unitName: 'g', gramsPerUnit: 1 }] },
  { query: 'dumpling steamed', name: '만두', category: 'korean', subcategory: 'snack', servings: [{ unitName: '개', gramsPerUnit: 35 }, { unitName: 'g', gramsPerUnit: 1 }] },
  { query: 'bibimbap', name: '비빔밥', category: 'korean', subcategory: 'rice', servings: [{ unitName: '그릇', gramsPerUnit: 400 }, { unitName: 'g', gramsPerUnit: 1 }] },
  { query: 'korean fried chicken', name: '치킨', category: 'korean', subcategory: 'meat', servings: [{ unitName: '조각', gramsPerUnit: 80 }, { unitName: '마리', gramsPerUnit: 800 }, { unitName: 'g', gramsPerUnit: 1 }] },
  { query: 'samgyeopsal pork belly', name: '삼겹살', category: 'korean', subcategory: 'meat', servings: [{ unitName: '인분', gramsPerUnit: 200 }, { unitName: 'g', gramsPerUnit: 1 }] },

  // === JAPANESE ===
  { query: 'sushi', name: '초밥', category: 'japanese', subcategory: 'rice', servings: [{ unitName: '개', gramsPerUnit: 30 }, { unitName: '접시', gramsPerUnit: 200 }, { unitName: 'g', gramsPerUnit: 1 }] },
  { query: 'tonkatsu', name: '돈까스', category: 'japanese', subcategory: 'meat', servings: [{ unitName: '인분', gramsPerUnit: 200 }, { unitName: 'g', gramsPerUnit: 1 }] },
  { query: 'miso soup', name: '미소시루', category: 'japanese', subcategory: 'soup', servings: [{ unitName: '그릇', gramsPerUnit: 200 }, { unitName: 'g', gramsPerUnit: 1 }] },
  { query: 'udon noodles', name: '우동', category: 'japanese', subcategory: 'noodle', servings: [{ unitName: '그릇', gramsPerUnit: 450 }, { unitName: 'g', gramsPerUnit: 1 }] },
  { query: 'sashimi salmon', name: '사시미', category: 'japanese', subcategory: 'fish', servings: [{ unitName: '인분', gramsPerUnit: 150 }, { unitName: 'g', gramsPerUnit: 1 }] },
  { query: 'karaage', name: '가라아게', category: 'japanese', subcategory: 'meat', servings: [{ unitName: '인분', gramsPerUnit: 150 }, { unitName: 'g', gramsPerUnit: 1 }] },
  { query: 'takoyaki', name: '타코야키', category: 'japanese', subcategory: 'snack', servings: [{ unitName: '개', gramsPerUnit: 35 }, { unitName: 'g', gramsPerUnit: 1 }] },

  // === WESTERN ===
  { query: 'pasta bolognese', name: '파스타', category: 'western', subcategory: 'noodle', servings: [{ unitName: '접시', gramsPerUnit: 300 }, { unitName: 'g', gramsPerUnit: 1 }] },
  { query: 'pizza margherita', name: '피자', category: 'western', subcategory: 'bread', servings: [{ unitName: '조각', gramsPerUnit: 130 }, { unitName: 'g', gramsPerUnit: 1 }] },
  { query: 'hamburger', name: '햄버거', category: 'western', subcategory: 'meat', servings: [{ unitName: '개', gramsPerUnit: 200 }, { unitName: 'g', gramsPerUnit: 1 }] },
  { query: 'steak beef', name: '스테이크', category: 'western', subcategory: 'meat', servings: [{ unitName: '인분', gramsPerUnit: 250 }, { unitName: 'g', gramsPerUnit: 1 }] },
  { query: 'caesar salad', name: '시저샐러드', category: 'western', subcategory: 'side', servings: [{ unitName: '접시', gramsPerUnit: 250 }, { unitName: 'g', gramsPerUnit: 1 }] },
  { query: 'french fries', name: '감자튀김', category: 'western', subcategory: 'side', servings: [{ unitName: '접시', gramsPerUnit: 150 }, { unitName: 'g', gramsPerUnit: 1 }] },
  { query: 'omelette', name: '오믈렛', category: 'western', subcategory: 'side', servings: [{ unitName: '개', gramsPerUnit: 150 }, { unitName: 'g', gramsPerUnit: 1 }] },
  { query: 'bagel plain', name: '베이글', category: 'western', subcategory: 'bread', servings: [{ unitName: '개', gramsPerUnit: 100 }, { unitName: 'g', gramsPerUnit: 1 }] },

  // === SE ASIAN ===
  { query: 'pad thai', name: '팟타이', category: 'seasian', subcategory: 'noodle', servings: [{ unitName: '접시', gramsPerUnit: 300 }, { unitName: 'g', gramsPerUnit: 1 }] },
  { query: 'pho', name: '쌀국수', category: 'seasian', subcategory: 'noodle', servings: [{ unitName: '그릇', gramsPerUnit: 500 }, { unitName: 'g', gramsPerUnit: 1 }] },
  { query: 'green curry', name: '그린커리', category: 'seasian', subcategory: 'soup', servings: [{ unitName: '그릇', gramsPerUnit: 350 }, { unitName: 'g', gramsPerUnit: 1 }] },
  { query: 'nasi goreng', name: '나시고렝', category: 'seasian', subcategory: 'rice', servings: [{ unitName: '접시', gramsPerUnit: 300 }, { unitName: 'g', gramsPerUnit: 1 }] },
  { query: 'banh mi', name: '반미', category: 'seasian', subcategory: 'bread', servings: [{ unitName: '개', gramsPerUnit: 200 }, { unitName: 'g', gramsPerUnit: 1 }] },
  { query: 'satay chicken', name: '사테', category: 'seasian', subcategory: 'meat', servings: [{ unitName: '꼬치', gramsPerUnit: 80 }, { unitName: 'g', gramsPerUnit: 1 }] },
  { query: 'hainanese chicken', name: '하이난치킨라이스', category: 'seasian', subcategory: 'rice', servings: [{ unitName: '인분', gramsPerUnit: 350 }, { unitName: 'g', gramsPerUnit: 1 }] },
]

async function fetchFood(query) {
  return new Promise((resolve, reject) => {
    const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&json=1&page_size=1&fields=product_name,nutriments&sort_by=unique_scans_n`;
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          const p = json.products?.[0];
          if (!p?.nutriments) { resolve(null); return; }
          const n = p.nutriments;
          resolve({
            name: p.product_name || '',
            caloriesPer100g: n['energy-kcal_100g'] || n['energy-kcal_value'] || 0,
            proteinPer100g: n.proteins_100g || n.proteins_value || 0,
            fatPer100g: n.fat_100g || n.fat_value || 0,
            carbsPer100g: n.carbohydrates_100g || n.carbohydrates_value || 0,
          });
        } catch { resolve(null); }
      });
    }).on('error', () => resolve(null));
  });
}

async function main() {
  const results = [];
  for (const food of FOODS_TO_SEARCH) {
    console.error(`Fetching: ${food.name} (${food.query})...`);
    const data = await fetchFood(food.query);
    if (data && data.caloriesPer100g > 0) {
      results.push({ ...food, ...data });
      console.error(`  ✅ ${food.name}: ${data.caloriesPer100g}kcal, P:${data.proteinPer100g}g F:${data.fatPer100g}g C:${data.carbsPer100g}g`);
    } else {
      console.error(`  ❌ ${food.name}: No data`);
    }
    await new Promise(r => setTimeout(r, 200)); // Rate limiting
  }
  
  console.log(JSON.stringify(results, null, 2));
  console.error(`\nDone! ${results.length}/${FOODS_TO_SEARCH.length} foods fetched.`);
}

main();
