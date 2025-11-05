import csv
import json
import os
import time
from pathlib import Path

import requests  # for Ollama REST API

# === Settings ===
MODEL_NAME = "llama3:instruct"   
CACHE_DIR = Path("cache")
CACHE_DIR.mkdir(exist_ok=True)
SYSTEM_PROMPT = Path("prompts/system_prompt.txt").read_text()
USER_PROMPT_TEMPLATE = Path("prompts/user_prompt.txt").read_text()
CSV_FILE = "recipes.csv"

# === Helper: call local LLaMA model ===
def query_llama(prompt: str, system_prompt: str, model: str = MODEL_NAME, max_retries=3):
    url = "http://localhost:11434/api/chat"  
    headers = {"Content-Type": "application/json"}

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": prompt}
    ]

    payload = {
        "model": model,
        "messages": messages,
        "stream": False
    }

    for attempt in range(max_retries):
        try:
            response = requests.post(url, headers=headers, json=payload)
            print(f"[DEBUG] Request URL: {url}, Status: {response.status_code}")
            response.raise_for_status()
            data = response.json()
            content = data["message"]["content"]
            return content
        except requests.exceptions.RequestException as e:
            print(f"[Retry {attempt+1}] LLaMA request failed: {e}")
            time.sleep(3)
    raise RuntimeError("LLaMA query failed after retries")



# === Helper: JSON-safe loading ===
def safe_json_loads(text):
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        # Try to extract JSON substring if extra text exists
        start = text.find("{")
        end = text.rfind("}")
        if start != -1 and end != -1:
            sub = text[start:end+1]
            try:
                return json.loads(sub)
            except json.JSONDecodeError:
                pass
        raise

# === Core pipeline ===
def process_recipe_row(row):
    recipe_id = row["idMeal"].strip()
    cache_file = CACHE_DIR / f"{recipe_id}.json"
    if cache_file.exists():
        print(f"✅ Cached: {recipe_id}")
        return json.loads(cache_file.read_text())

    ingredients = []
    for i in range(1, 21):
        name = row.get(f"strIngredient{i}")
        measure = row.get(f"strMeasure{i}")
        if name and name.strip():
            ingredients.append(f"- {name.strip()} ({measure.strip()})")
    ingredient_list = "\n".join(ingredients)

    user_prompt = USER_PROMPT_TEMPLATE.format(
        strMeal=row["strMeal"],
        strCategory=row["strCategory"],
        strArea=row["strArea"],
        strTags=row["strTags"],
        strInstructions=row["strInstructions"],
        strMealThumb=row["strMealThumb"],
        strSource=row["strSource"],
        strYoutube=row["strYoutube"],
        ingredient_list=ingredient_list
    )

    response_text = query_llama(user_prompt, SYSTEM_PROMPT)
    try:
        data = safe_json_loads(response_text)
    except Exception as e:
        print(f"⚠️ JSON parsing failed for recipe {recipe_id}, response_text {response_text}: {e}")
        data = {"error": str(e), "raw": response_text}

    cache_file.write_text(json.dumps(data, indent=2, ensure_ascii=False))
    print(f"💾 Saved: {cache_file}")
    return data

# === Main ===
def main():
    with open(CSV_FILE, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            process_recipe_row(row)

