"""
Import Guzman Y Gomez nutrition data from PDF into 123MOG database.

PDF: 240429_U-NUTRITIONALINFO_Apr2024.pdf
Pages 4-14: Nutrition data by menu category.

Strategy for no-serving-size: store total-per-serving macros as per100g values,
and add a serving of 1개 = 100g. Logging 1개 gives 100g × (cal/100) = total cal.
"""
import json
import re
import sqlite3
import uuid
from pathlib import Path

DB_PATH = r"C:\Users\sungj\123mog\dev.db"
JSON_OUT = r"C:\Users\sungj\123mog\prisma\data\gyg-nutrition.json"
PDF_PATH = r"C:\Users\sungj\Downloads\240429_U-NUTRITIONALINFO_Apr2024.pdf"

# All known category headers (exact as in PDF)
ALL_CATEGORIES = [
    "BURRITO BOWL", "BURRITO",
    "CALI BURRITO", "ENCHILADA",
    "NACHO FRIES", "NACHOS",
    "SALAD", "1 TACO - HARD SHELL",
    "1 TACO - SOFT FLOUR TORTILLA", "QUESO FRIES",
    "CORN CHIPS", "SIDES",
    "LITTLE G'S", "MINI BURRITO BOWL",
    "MINI BURRITO", "MINI CALI BURRITO",
    "MINI ENCHILADA", "MINI NACHO FRIES",
    "MINI NACHOS", "BREAKFAST BURRITO",
    "SCRAMBLED EGGS", "TOAST - 1 SLICE",
]

# Items on page 14 that are orphaned duplicates from MINI NACHOS
DUPLICATE_ITEMS_PAGE_14 = {
    "Spicy Ground Beef", "Spicy Pulled Pork",
    "Spicy Sautéed Vegetables with Guacamole", "Spicy Slow Cooked Beef"
}

# Column headers to skip (they immediately follow a category header)
COLUMN_HEADERS = {
    "CALORIES", "CCALORIES FROM FAT", "TOTAL FAT (G)",
    "SATURATED FAT (G)", "TRANS FAT (G)", "CHOLESTEROL (MG)",
    "SODIUM (MG)", "TOTAL", "CARBOHYDRATE (G)", "DIETARY FIBER (G)",
    "SUGARS (G)", "PROTEIN (G)",
}


def parse_numeric(value_str: str) -> float:
    value_str = value_str.strip().replace(",", "")
    if value_str.startswith("<"):
        value_str = value_str[1:]
    try:
        return float(value_str)
    except ValueError:
        return 0.0


def parse_pdf():
    """Parse GYG PDF and return list of items."""
    import pymupdf
    doc = pymupdf.open(PDF_PATH)
    all_items = []
    
    for page_idx in range(3, 14):
        page = doc[page_idx]
        text = page.get_text()
        raw_lines = text.split("\n")
        
        # Strip all lines, remove empty and boilerplate
        lines = []
        for line in raw_lines:
            stripped = line.strip()
            if not stripped:
                continue
            if (stripped.startswith("Nutrition information") or
                stripped.startswith("At Guzman") or
                stripped.startswith("Information current")):
                continue
            lines.append(stripped)
        
        current_category = None
        i = 0
        while i < len(lines):
            line = lines[i]
            
            # Check for category header
            if line in ALL_CATEGORIES:
                current_category = line
                i += 1
                # Skip column headers
                while i < len(lines) and lines[i] in COLUMN_HEADERS:
                    i += 1
                continue
            
            # Skip column headers even without preceding category (e.g. after boilerplate)
            if line in COLUMN_HEADERS:
                i += 1
                continue
            
            # If we have a current category and this looks like a data item (not a number)
            if current_category:
                try:
                    float(line.replace(",", "").replace("<", ""))
                    # It's a number — skip, we're looking for item names
                    i += 1
                    continue
                except ValueError:
                    pass
                
                protein_name = line
                
                # Skip page 14 orphaned duplicates
                if page_idx == 13 and protein_name in DUPLICATE_ITEMS_PAGE_14:
                    # Skip this item + its 11 values
                    i += 1
                    # The following 11 lines should be numeric, skip them
                    consumed = 0
                    j = i
                    while j < len(lines) and consumed < 11:
                        try:
                            float(lines[j].replace(",", "").replace("<", ""))
                            consumed += 1
                            j += 1
                        except ValueError:
                            break
                    i = j
                    print(f"  [SKIP dup on pg14] {protein_name}")
                    continue
                
                # Collect the next 11 numeric values
                values = []
                j = i + 1
                while j < len(lines) and len(values) < 11:
                    try:
                        val = float(lines[j].replace(",", "").replace("<", ""))
                        values.append(val)
                        j += 1
                    except ValueError:
                        break
                
                if len(values) == 11:
                    item = {
                        "protein": protein_name,
                        "category": current_category,
                        "calories": values[0],
                        "fat_g": values[2],
                        "carbs_g": values[7],
                        "protein_g": values[10],
                        "sodium_mg": values[6],
                    }
                    all_items.append(item)
                    i = j
                    continue
            
            i += 1
    
    doc.close()
    return all_items


def import_to_db(items: list):
    db = sqlite3.connect(DB_PATH)
    cursor = db.cursor()
    
    cursor.execute("SELECT name FROM Food")
    existing = {row[0].lower() for row in cursor.fetchall()}
    
    imported = 0
    skipped = 0
    
    for item in items:
        food_name = f"[GYG] {item['protein']} {item['category']}"
        food_name_en = f"GYG {item['protein']} {item['category']}"
        
        if food_name.lower() in existing:
            skipped += 1
            continue
        
        food_id = str(uuid.uuid4())
        
        try:
            cursor.execute("""
                INSERT INTO Food (id, name, nameEn, category, subcategory,
                    caloriesPer100g, proteinPer100g, fatPer100g, carbsPer100g, sodiumPer100g)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                food_id, food_name, food_name_en,
                "western", "mexican",
                item["calories"], item["protein_g"],
                item["fat_g"], item["carbs_g"], item["sodium_mg"],
            ))
            
            cursor.execute("""
                INSERT INTO FoodServing (id, foodId, unitName, gramsPerUnit)
                VALUES (?, ?, ?, ?)
            """, (str(uuid.uuid4()), food_id, "개", 100.0))
            
            imported += 1
            existing.add(food_name.lower())
            
        except Exception as e:
            print(f"  ERROR inserting {food_name}: {e}")
    
    db.commit()
    db.close()
    return imported, skipped


def main():
    print("=" * 60)
    print("GYG Nutrition Data Import v2")
    print("=" * 60)
    
    # Parse
    print("\n--- Parsing PDF pages 4-14 ---")
    items = parse_pdf()
    
    # Print categorized summary
    cats = {}
    for item in items:
        cats.setdefault(item["category"], [])
        cats[item["category"]].append(item["protein"])
    
    for cat, proteins in sorted(cats.items()):
        print(f"\n{cat} ({len(proteins)} items):")
        for p in proteins:
            cals = next(it["calories"] for it in items if it["category"] == cat and it["protein"] == p)
            na = next(it["sodium_mg"] for it in items if it["category"] == cat and it["protein"] == p)
            print(f"   - {p:45s} {cals:4.0f} cal  {na:4.0f} mg Na")
    
    print(f"\nTotal items parsed: {len(items)}")
    
    # Save JSON
    Path(JSON_OUT).parent.mkdir(parents=True, exist_ok=True)
    with open(JSON_OUT, "w", encoding="utf-8") as f:
        json.dump(items, f, ensure_ascii=False, indent=2)
    print(f"\nSaved JSON to {JSON_OUT}")
    
    # Import to DB
    print("\n--- Importing to Database ---")
    imp, skp = import_to_db(items)
    print(f"\n✅ {imp} imported, {skp} skipped (duplicates)")
    
    # Summary by category
    print("\n--- Summary by Category ---")
    for cat, proteins in sorted(cats.items()):
        print(f"  {cat:30s}: {len(proteins):2d} items")


if __name__ == "__main__":
    main()
