#!/usr/bin/env python3
"""
Import CSV data to Supabase tables.
Run this script after cache_to_csv.py to populate the database.
"""

import csv
import os
from pathlib import Path

# Try to import supabase, if not available, provide instructions
try:
    from supabase import create_client, Client
except ImportError:
    print("❌ supabase package not found. Installing...")
    os.system("pip install supabase")
    from supabase import create_client, Client

# Supabase configuration
SUPABASE_URL = "https://aestwtrsdigzexjhpfuf.supabase.co"
# Use service_role key to bypass RLS
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFlc3R3dHJzZGlnemV4amhwZnVmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDM2MzE4MywiZXhwIjoyMDc5OTM5MTgzfQ.4gaVA-nQPu0g4JcgycQoqAtND9KCdXzY1qfEPAmJyOU"

# CSV files to import (in order due to foreign key constraints)
# Note: Supabase table names use PascalCase
CSV_FILES = [
    ("tags-supabase.csv", "RecipeTag"),
    ("ingredients-supabase.csv", "Ingredient"),
    ("recipes-supabase.csv", "Recipe"),
    ("recipe_ingredient_map-supabase.csv", "Recipe-Ingredient_Map"),
    ("recipe_tag_map-supabase.csv", "Recipe-Tag_Map"),
]


def read_csv(file_path: Path) -> list[dict]:
    """Read CSV file and return list of dictionaries."""
    rows = []
    with open(file_path, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            # Convert empty strings to None and handle numeric types
            cleaned_row = {}
            for key, value in row.items():
                if value == "":
                    cleaned_row[key] = None
                elif key in [
                    "id",
                    "recipe_id",
                    "ingredient_id",
                    "tag_id",
                    "min_prep_time",
                    "green_score",
                ]:
                    cleaned_row[key] = int(value) if value else None
                elif key in [
                    "calories_kcal",
                    "protein_g",
                    "carbs_g",
                    "sugars_g",
                    "agg_fats_g",
                    "cholesterol_mg",
                    "agg_minerals_mg",
                    "vit_a_microg",
                    "agg_vit_b_mg",
                    "vit_c_mg",
                    "vit_d_microg",
                    "vit_e_mg",
                    "vit_k_microg",
                ]:
                    cleaned_row[key] = float(value) if value else None
                else:
                    cleaned_row[key] = value
            rows.append(cleaned_row)
    return rows


def import_table(
    supabase: Client, table_name: str, data: list[dict], batch_size: int = 100
):
    """Import data to Supabase table in batches."""
    total = len(data)
    imported = 0

    for i in range(0, total, batch_size):
        batch = data[i : i + batch_size]
        try:
            # Use upsert to handle potential duplicates
            result = supabase.table(table_name).upsert(batch).execute()
            imported += len(batch)
            print(f"  📥 {table_name}: {imported}/{total} rows imported")
        except Exception as e:
            print(f"  ❌ Error importing to {table_name}: {e}")
            # Try inserting one by one to identify problematic rows
            for row in batch:
                try:
                    supabase.table(table_name).upsert(row).execute()
                    imported += 1
                except Exception as row_error:
                    print(f"    ⚠️ Failed row: {row.get('id', 'unknown')} - {row_error}")

    return imported


def main():
    print("🚀 Starting Supabase data import...")
    print(f"📡 Connecting to: {SUPABASE_URL}")

    # Create Supabase client
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

    data_dir = Path(__file__).parent

    for csv_file, table_name in CSV_FILES:
        csv_path = data_dir / csv_file

        if not csv_path.exists():
            print(f"⚠️ Skipping {csv_file} - file not found")
            continue

        print(f"\n📄 Processing {csv_file} -> {table_name}")

        # Read CSV data
        data = read_csv(csv_path)
        print(f"  📊 Found {len(data)} rows")

        if not data:
            print(f"  ⚠️ No data to import")
            continue

        # Import to Supabase
        imported = import_table(supabase, table_name, data)
        print(f"  ✅ Completed: {imported} rows imported to {table_name}")

    print("\n🎉 Data import completed!")
    print("\n📋 Next steps:")
    print("1. Visit http://localhost:3000 to verify the application")
    print("2. Check the Supabase dashboard to verify data")


if __name__ == "__main__":
    main()
