#!/usr/bin/env python3
"""
Import shopping list seed data to Supabase.
Creates sample shopping lists with items for testing.
"""

import os
from datetime import datetime

# Try to import supabase
try:
    from supabase import create_client, Client
except ImportError:
    print("❌ supabase package not found. Installing...")
    os.system("pip install supabase")
    from supabase import create_client, Client

# Supabase configuration
SUPABASE_URL = "https://aestwtrsdigzexjhpfuf.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFlc3R3dHJzZGlnemV4amhwZnVmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDM2MzE4MywiZXhwIjoyMDc5OTM5MTgzfQ.4gaVA-nQPu0g4JcgycQoqAtND9KCdXzY1qfEPAmJyOU"


def get_user_id(supabase: Client) -> str:
    """Get the first user's ID from auth.users table."""
    try:
        result = supabase.auth.admin.list_users()
        if result and len(result) > 0:
            user = result[0]
            return user.id
    except Exception as e:
        print(f"❌ Error getting user: {e}")
    return None


def get_ingredient_ids(supabase: Client) -> dict:
    """Get ingredient IDs by name."""
    result = supabase.table("Ingredient").select("id, name").execute()
    return {row["name"]: row["id"] for row in result.data}


def create_shopping_lists(supabase: Client, user_id: str) -> dict:
    """Create shopping lists and return their IDs."""
    lists_data = [
        {
            "user_id": user_id,
            "name": "Weekly Groceries",
            "description": "Regular weekly shopping list for household essentials",
            "is_archived": False,
        },
        {
            "user_id": user_id,
            "name": "Party Planning",
            "description": "Ingredients for the weekend BBQ party",
            "is_archived": False,
        },
        {
            "user_id": user_id,
            "name": "Baking Project",
            "description": "Items needed for birthday cake",
            "is_archived": False,
        },
        {
            "user_id": user_id,
            "name": "Last Week Groceries",
            "description": "Completed shopping from last week",
            "is_archived": True,
        },
    ]

    list_ids = {}
    for list_data in lists_data:
        # Check if list already exists
        existing = (
            supabase.table("shopping_lists")
            .select("id")
            .eq("user_id", user_id)
            .eq("name", list_data["name"])
            .execute()
        )

        if existing.data:
            list_ids[list_data["name"]] = existing.data[0]["id"]
            print(f"  ℹ️ List '{list_data['name']}' already exists")
        else:
            result = supabase.table("shopping_lists").insert(list_data).execute()
            list_ids[list_data["name"]] = result.data[0]["id"]
            print(f"  ✅ Created list '{list_data['name']}'")

    return list_ids


def create_shopping_items(supabase: Client, list_ids: dict, ingredients: dict) -> None:
    """Create shopping list items."""

    # Weekly Groceries items
    weekly_items = [
        # Dairy
        {"name": "Milk", "qty": 2, "unit": "carton", "cat": "Dairy", "checked": True},
        {"name": "Eggs", "qty": 12, "unit": "pieces", "cat": "Dairy", "checked": True},
        {"name": "Butter", "qty": 1, "unit": "pack", "cat": "Dairy", "checked": False},
        {
            "name": "Cheese",
            "qty": 200,
            "unit": "g",
            "cat": "Dairy",
            "checked": False,
            "notes": "Get cheddar",
        },
        # Produce
        {
            "name": "Onion",
            "qty": 3,
            "unit": "pieces",
            "cat": "Produce",
            "checked": False,
        },
        {
            "name": "Garlic",
            "qty": 1,
            "unit": "head",
            "cat": "Produce",
            "checked": False,
        },
        {
            "name": "Tomato",
            "qty": 4,
            "unit": "pieces",
            "cat": "Produce",
            "checked": False,
            "notes": "Ripe for salads",
        },
        {
            "name": "Carrot",
            "qty": 6,
            "unit": "pieces",
            "cat": "Produce",
            "checked": False,
        },
        {
            "name": "Potato",
            "qty": 5,
            "unit": "pieces",
            "cat": "Produce",
            "checked": False,
        },
        # Meat
        {
            "name": "Chicken",
            "qty": 500,
            "unit": "g",
            "cat": "Meat",
            "checked": False,
            "notes": "Boneless breast",
        },
        {
            "name": "Beef",
            "qty": 400,
            "unit": "g",
            "cat": "Meat",
            "checked": False,
            "notes": "Ground beef for tacos",
        },
        # Custom (no ingredient_id)
        {
            "name": "Paper Towels",
            "qty": 2,
            "unit": "rolls",
            "cat": "Household",
            "checked": False,
            "custom": True,
        },
        {
            "name": "Dish Soap",
            "qty": 1,
            "unit": "bottle",
            "cat": "Household",
            "checked": True,
            "custom": True,
        },
    ]

    # Party Planning items
    party_items = [
        {
            "name": "Beef",
            "qty": 2000,
            "unit": "g",
            "cat": "Meat",
            "checked": False,
            "notes": "Ribeye steaks",
        },
        {
            "name": "Chicken",
            "qty": 1500,
            "unit": "g",
            "cat": "Meat",
            "checked": False,
            "notes": "Wings and drumsticks",
        },
        {
            "name": "Pork",
            "qty": 1000,
            "unit": "g",
            "cat": "Meat",
            "checked": False,
            "notes": "Ribs",
        },
        {
            "name": "Onion",
            "qty": 5,
            "unit": "pieces",
            "cat": "Produce",
            "checked": False,
        },
        {
            "name": "Bell Pepper",
            "qty": 6,
            "unit": "pieces",
            "cat": "Produce",
            "checked": False,
        },
        {
            "name": "Charcoal",
            "qty": 2,
            "unit": "bags",
            "cat": "Supplies",
            "checked": False,
            "custom": True,
        },
        {
            "name": "BBQ Sauce",
            "qty": 2,
            "unit": "bottles",
            "cat": "Condiments",
            "checked": False,
            "custom": True,
        },
        {
            "name": "Paper Plates",
            "qty": 50,
            "unit": "pieces",
            "cat": "Supplies",
            "checked": False,
            "custom": True,
        },
        {
            "name": "Ice",
            "qty": 3,
            "unit": "bags",
            "cat": "Drinks",
            "checked": False,
            "custom": True,
        },
    ]

    # Baking Project items
    baking_items = [
        {
            "name": "Flour",
            "qty": 1000,
            "unit": "g",
            "cat": "Baking",
            "checked": True,
            "notes": "All-purpose",
        },
        {"name": "Sugar", "qty": 500, "unit": "g", "cat": "Baking", "checked": True},
        {
            "name": "Butter",
            "qty": 250,
            "unit": "g",
            "cat": "Baking",
            "checked": False,
            "notes": "Unsalted",
        },
        {"name": "Eggs", "qty": 6, "unit": "pieces", "cat": "Baking", "checked": False},
        {
            "name": "Baking Powder",
            "qty": 1,
            "unit": "can",
            "cat": "Baking",
            "checked": False,
            "custom": True,
        },
        {
            "name": "Sprinkles",
            "qty": 2,
            "unit": "containers",
            "cat": "Decoration",
            "checked": False,
            "custom": True,
        },
    ]

    # Archived list items (all checked)
    archived_items = [
        {"name": "Milk", "qty": 1, "unit": "carton", "cat": "Dairy", "checked": True},
        {"name": "Bread", "qty": 1, "unit": "loaf", "cat": "Bakery", "checked": True},
        {"name": "Rice", "qty": 1000, "unit": "g", "cat": "Pantry", "checked": True},
    ]

    items_map = {
        "Weekly Groceries": weekly_items,
        "Party Planning": party_items,
        "Baking Project": baking_items,
        "Last Week Groceries": archived_items,
    }

    for list_name, items in items_map.items():
        list_id = list_ids.get(list_name)
        if not list_id:
            continue

        # Clear existing items
        supabase.table("shopping_list_items").delete().eq(
            "shopping_list_id", list_id
        ).execute()

        position = 0
        for item in items:
            position += 1
            ingredient_id = (
                None if item.get("custom") else ingredients.get(item["name"])
            )

            item_data = {
                "shopping_list_id": list_id,
                "ingredient_id": ingredient_id,
                "item_name": item["name"],
                "quantity": item["qty"],
                "unit": item["unit"],
                "category": item["cat"],
                "is_checked": item["checked"],
                "position": position,
                "notes": item.get("notes"),
            }

            try:
                supabase.table("shopping_list_items").insert(item_data).execute()
            except Exception as e:
                print(f"    ⚠️ Failed to insert {item['name']}: {e}")

        print(f"  📝 Added {len(items)} items to '{list_name}'")


def main():
    print("🛒 Starting Shopping List Seed Data Import...")
    print(f"📡 Connecting to: {SUPABASE_URL}")

    # Create Supabase client
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

    # Get user ID
    print("\n👤 Finding user...")
    user_id = get_user_id(supabase)
    if not user_id:
        print("❌ No user found. Please create an account first.")
        return
    print(f"  ✅ Using user: {user_id}")

    # Get ingredient IDs
    print("\n🥕 Loading ingredients...")
    ingredients = get_ingredient_ids(supabase)
    print(f"  ✅ Found {len(ingredients)} ingredients")

    # Create shopping lists
    print("\n📋 Creating shopping lists...")
    list_ids = create_shopping_lists(supabase, user_id)

    # Create shopping items
    print("\n🛍️ Adding shopping items...")
    create_shopping_items(supabase, list_ids, ingredients)

    print("\n🎉 Shopping list seed data import completed!")
    print("\n📋 Created lists:")
    print("  • Weekly Groceries (active, mixed checked/unchecked)")
    print("  • Party Planning (active, BBQ items)")
    print("  • Baking Project (active, baking items)")
    print("  • Last Week Groceries (archived, all checked)")


if __name__ == "__main__":
    main()
