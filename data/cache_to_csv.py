import csv
import json
import os
from pathlib import Path


def load_recipes_data(recipes_csv_path='recipes.csv'):
    recipes_desc = {}
    try:
        with open(recipes_csv_path, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                recipes_desc[row['idMeal']] = row['strInstructions']
    except FileNotFoundError:
        print(f"Warning: {recipes_csv_path} not found. Descriptions will be empty.")
    return recipes_desc

def process_json_files(cache_dir='cache', recipes_csv_path='recipes.csv'):
    recipes_desc = load_recipes_data(recipes_csv_path)

    ingredients_dict = {}  # key: (name, unit), value: ingredient data
    recipes_list = []
    maps_list = []
    
    ingredient_id_map = {}
    next_ingredient_id = 1
    next_map_id = 1
    
    cache_path = Path(cache_dir)
    if not cache_path.exists():
        print(f"Error: {cache_dir} directory not found.")
        return
    
    json_files = list(cache_path.glob('*.json'))
    print(f"Found {len(json_files)} JSON files in {cache_dir}")
    
    for json_file in sorted(json_files)[:30]:
        print(f"Processing {json_file.name}...")
        
        with open(json_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        for ingredient in data['ingredients']:
            key = (ingredient['name'], ingredient['unit'])
            
            if key not in ingredients_dict:
                ingredients_dict[key] = {
                    'id': next_ingredient_id,
                    'name': ingredient['name'],
                    'unit': ingredient['unit'],
                    'calories_kcal': ingredient['calories_kcal'],
                    'protein_g': ingredient['protein_g'],
                    'carbs_g': ingredient['carbs_g'],
                    'sugars_g': ingredient['sugars_g'],
                    'agg_fats_g': ingredient['agg_fats_g'],
                    'cholesterol_mg': ingredient['cholesterol_mg'],
                    'agg_minerals_mg': ingredient['agg_minerals_mg'],
                    'vit_a_microg': ingredient['vit_a_microg'],
                    'agg_vit_b_mg': ingredient['agg_vit_b_mg'],
                    'vit_c_mg': ingredient['vit_c_mg'],
                    'vit_d_microg': ingredient['vit_d_microg'],
                    'vit_e_mg': ingredient['vit_e_mg'],
                    'vit_k_microg': ingredient['vit_k_microg']
                }
                
                ingredient_id_map[(data['recipe']['id'], ingredient['id'])] = next_ingredient_id
                next_ingredient_id += 1
            else:
                ingredient_id_map[(data['recipe']['id'], ingredient['id'])] = ingredients_dict[key]['id']
        
        recipe = data['recipe']
        recipe_id_str = str(recipe['id'])
        description = recipes_desc.get(recipe_id_str, '')
        
        recipes_list.append({
            'id': recipe['id'],
            'name': recipe['name'],
            'description': description,
            'min_prep_time': recipe['min_prep_time'],
            'green_score': recipe['green_score'],
            'image_url': recipe['image_url']
        })
        
        for map_item in data['map']:
            new_ingredient_id = ingredient_id_map[(recipe['id'], map_item['ingredient_id'])]
            
            maps_list.append({
                'id': next_map_id,
                'recipe_id': map_item['recipe_id'],
                'ingredient_id': new_ingredient_id,
                'relative_unit_100': int(map_item['relative_unit_100'])
            })
            next_map_id += 1
    
    print("\nWriting CSV files...")
    
    # 1. Ingredients CSV
    ingredients_list = sorted(ingredients_dict.values(), key=lambda x: x['id'])
    with open('ingredients-supabase.csv', 'w', newline='', encoding='utf-8') as f:
        fieldnames = ['id', 'name', 'unit', 'calories_kcal', 'protein_g', 'carbs_g', 
                     'sugars_g', 'agg_fats_g', 'cholesterol_mg', 'agg_minerals_mg', 
                     'vit_a_microg', 'agg_vit_b_mg', 'vit_c_mg', 'vit_d_microg', 
                     'vit_e_mg', 'vit_k_microg']
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(ingredients_list)
    print(f"✓ ingredients-supabase.csv created ({len(ingredients_list)} rows)")
    
    # 2. Recipes CSV 
    with open('recipes-supabase.csv', 'w', newline='', encoding='utf-8') as f:
        fieldnames = ['id', 'name', 'description', 'min_prep_time', 'green_score', 'image_url']
        writer = csv.DictWriter(f, fieldnames=fieldnames, quoting=csv.QUOTE_ALL)
        writer.writeheader()
        writer.writerows(recipes_list)
    print(f"✓ recipes-supabase.csv created ({len(recipes_list)} rows)")
    
    # 3. Recipe-Ingredient Map CSV
    with open('recipe_ingredient_map-supabase.csv', 'w', newline='', encoding='utf-8') as f:
        fieldnames = ['id', 'recipe_id', 'ingredient_id', 'relative_unit_100']
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(maps_list)
    print(f"✓ recipe_ingredient_map-supabase.csv created ({len(maps_list)} rows)")
    
    print("\nSummary:")
    print(f"- Unique ingredients: {len(ingredients_list)}")
    print(f"- Recipes: {len(recipes_list)}")
    print(f"- Recipe-Ingredient mappings: {len(maps_list)}")

if __name__ == '__main__':
    process_json_files(cache_dir='cache', recipes_csv_path='recipes.csv')