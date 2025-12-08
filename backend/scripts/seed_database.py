import os
import pandas as pd
from supabase import create_client, Client
from dotenv import load_dotenv
import sys

# Add parent directory to path to allow importing from api if needed, 
# though we are just using libraries here.
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

def seed_database():
    # Load environment variables
    load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env'))
    
    url: str = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
    key: str = os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")

    if not url or not key:
        print("Error: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set in .env")
        return

    supabase: Client = create_client(url, key)

    # ID mappings: old_id -> new_id
    id_mappings = {
        'recipe': {},
        'ingredient': {},
        'recipetag': {}
    }

    # Phase 1: Seed base tables and track ID mappings
    base_tables = [
        ("recipes-supabase.csv", "recipe"),
        ("ingredients-supabase.csv", "ingredient"),
        ("tags-supabase.csv", "recipetag"),
    ]

    dataset_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "dataset")

    for filename, table_name in base_tables:
        file_path = os.path.join(dataset_dir, filename)
        print(f"Processing {filename} -> {table_name}...")

        try:
            df = pd.read_csv(file_path)
            
            # Convert to dict records first
            records = df.to_dict(orient='records')
            
            # Insert records one by one to track ID mappings
            for record in records:
                old_id = record.get('id')
                
                # Clean record: replace NaN/NaT/inf with None and remove 'id' field
                cleaned_record = {}
                for k, v in record.items():
                    # Skip 'id' field - let database auto-generate it
                    if k == 'id':
                        continue
                    # Check for NaN (pandas uses float('nan') for missing numeric/text)
                    if pd.isna(v):
                        cleaned_record[k] = None
                    else:
                        cleaned_record[k] = v
                
                try:
                    # Insert and get the new ID
                    response = supabase.table(table_name).insert(cleaned_record).execute()
                    if response.data and len(response.data) > 0:
                        new_id = response.data[0]['id']
                        if old_id is not None:
                            id_mappings[table_name][int(old_id)] = new_id
                except Exception as e:
                    print(f"  Error inserting record with old_id {old_id} into {table_name}: {e}")
            
            print(f"Successfully seeded {table_name} ({len(id_mappings[table_name])} records)")

        except FileNotFoundError:
            print(f"Error: File {file_path} not found.")
        except Exception as e:
            print(f"Error processing {filename}: {e}")

    # Phase 2: Seed mapping tables with updated foreign keys
    mapping_tables = [
        ("recipe_ingredient_map-supabase.csv", "Recipe_Ingredient_Map", "recipe_id", "ingredient_id"),
        ("recipe_tag_map-supabase.csv", "Recipe_Tag_Map", "recipe_id", "tag_id"),
    ]

    for filename, table_name, fk1, fk2 in mapping_tables:
        file_path = os.path.join(dataset_dir, filename)
        print(f"Processing {filename} -> {table_name}...")

        try:
            df = pd.read_csv(file_path)
            records = df.to_dict(orient='records')
            
            # Update foreign keys and clean records
            cleaned_records = []
            for record in records:
                cleaned_record = {}
                for k, v in record.items():
                    # Skip 'id' field
                    if k == 'id':
                        continue
                    
                    # Update foreign keys using mappings
                    if k == fk1 and not pd.isna(v):
                        old_fk = int(v)
                        new_fk = id_mappings['recipe'].get(old_fk)
                        if new_fk is None:
                            print(f"  Warning: No mapping found for recipe_id {old_fk}")
                            continue  # Skip this record
                        cleaned_record[k] = new_fk
                    elif k == fk2 and not pd.isna(v):
                        old_fk = int(v)
                        # Determine which mapping to use based on table
                        mapping_key = 'ingredient' if 'ingredient' in fk2 else 'recipetag'
                        new_fk = id_mappings[mapping_key].get(old_fk)
                        if new_fk is None:
                            print(f"  Warning: No mapping found for {fk2} {old_fk}")
                            continue  # Skip this record
                        cleaned_record[k] = new_fk
                    elif pd.isna(v):
                        cleaned_record[k] = None
                    else:
                        cleaned_record[k] = v
                
                # Only add if we have both foreign keys
                if fk1 in cleaned_record and fk2 in cleaned_record:
                    cleaned_records.append(cleaned_record)
            
            # Insert in batches
            batch_size = 100
            for i in range(0, len(cleaned_records), batch_size):
                batch = cleaned_records[i:i + batch_size]
                try:
                    response = supabase.table(table_name).insert(batch).execute()
                except Exception as e:
                    print(f"  Error inserting batch {i//batch_size + 1} into {table_name}: {e}")
            
            print(f"Successfully seeded {table_name} ({len(cleaned_records)} records)")

        except FileNotFoundError:
            print(f"Error: File {file_path} not found.")
        except Exception as e:
            print(f"Error processing {filename}: {e}")

if __name__ == "__main__":
    seed_database()