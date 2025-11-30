/**
 * Seed inventory data script
 * Run with: npx tsx scripts/seed-inventory.ts
 */

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Missing environment variables!");
  console.error("   NEXT_PUBLIC_SUPABASE_URL:", supabaseUrl ? "✓" : "✗");
  console.error("   SUPABASE_SERVICE_ROLE_KEY:", supabaseServiceKey ? "✓" : "✗");
  process.exit(1);
}

// Create admin client with service role (bypasses RLS)
const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface InventoryItem {
  ingredient_id: number;
  quantity: number;
  unit: string;
  location: "fridge" | "pantry" | "freezer" | "other";
  expiration_date: string | null;
  min_quantity: number | null;
  notes: string | null;
}

async function seedInventory() {
  console.log("🚀 Starting inventory seed...\n");

  // Get all users (or you can specify a user ID)
  const { data: users, error: usersError } = await supabase.auth.admin.listUsers();

  if (usersError) {
    console.error("❌ Error fetching users:", usersError.message);
    return;
  }

  if (!users || users.users.length === 0) {
    console.error("❌ No users found in the database");
    return;
  }

  // Use the first user (or modify to use a specific user)
  const userId = users.users[0].id;
  console.log(`📝 Using user: ${users.users[0].email} (${userId})\n`);

  // Calculate dates relative to today
  const today = new Date();
  const addDays = (days: number): string => {
    const date = new Date(today);
    date.setDate(date.getDate() + days);
    return date.toISOString().split("T")[0];
  };

  // Inventory items to seed
  const inventoryItems: InventoryItem[] = [
    // ========== FRIDGE ITEMS ==========
    // Expired
    {
      ingredient_id: 38,
      quantity: 2,
      unit: "cups",
      location: "fridge",
      expiration_date: addDays(-1),
      min_quantity: null,
      notes: "⚠️ Check before use - might be expired",
    },
    // Critical (1-2 days)
    {
      ingredient_id: 39,
      quantity: 6,
      unit: "pieces",
      location: "fridge",
      expiration_date: addDays(1),
      min_quantity: 3,
      notes: "Fresh eggs - use soon!",
    },
    {
      ingredient_id: 44,
      quantity: 150,
      unit: "g",
      location: "fridge",
      expiration_date: addDays(2),
      min_quantity: 100,
      notes: "Cheddar cheese",
    },
    // Warning (3-7 days)
    {
      ingredient_id: 24,
      quantity: 200,
      unit: "g",
      location: "fridge",
      expiration_date: addDays(5),
      min_quantity: null,
      notes: "Butter - salted",
    },
    {
      ingredient_id: 8,
      quantity: 100,
      unit: "g",
      location: "fridge",
      expiration_date: addDays(6),
      min_quantity: null,
      notes: "Feta cheese for salads",
    },
    // Good (7+ days)
    {
      ingredient_id: 45,
      quantity: 80,
      unit: "g",
      location: "fridge",
      expiration_date: addDays(30),
      min_quantity: null,
      notes: "Parmesan - grated",
    },

    // ========== PANTRY ITEMS ==========
    {
      ingredient_id: 41,
      quantity: 500,
      unit: "g",
      location: "pantry",
      expiration_date: addDays(180),
      min_quantity: 200,
      notes: "All-purpose flour",
    },
    {
      ingredient_id: 40,
      quantity: 400,
      unit: "g",
      location: "pantry",
      expiration_date: addDays(365),
      min_quantity: 200,
      notes: "Granulated sugar",
    },
    {
      ingredient_id: 43,
      quantity: 200,
      unit: "g",
      location: "pantry",
      expiration_date: null,
      min_quantity: 100,
      notes: "Table salt - never expires",
    },
    {
      ingredient_id: 2,
      quantity: 500,
      unit: "ml",
      location: "pantry",
      expiration_date: addDays(90),
      min_quantity: 200,
      notes: "Extra virgin olive oil",
    },
    {
      ingredient_id: 33,
      quantity: 300,
      unit: "ml",
      location: "pantry",
      expiration_date: addDays(365),
      min_quantity: null,
      notes: "Soy sauce",
    },
    {
      ingredient_id: 48,
      quantity: 350,
      unit: "g",
      location: "pantry",
      expiration_date: addDays(730),
      min_quantity: null,
      notes: "Pure honey",
    },
    // Low stock items
    {
      ingredient_id: 7,
      quantity: 10,
      unit: "g",
      location: "pantry",
      expiration_date: addDays(14),
      min_quantity: 50,
      notes: "Minced garlic - LOW!",
    },
    {
      ingredient_id: 3,
      quantity: 50,
      unit: "g",
      location: "pantry",
      expiration_date: addDays(7),
      min_quantity: 100,
      notes: "Chopped onion - need more!",
    },

    // ========== FREEZER ITEMS ==========
    {
      ingredient_id: 12,
      quantity: 400,
      unit: "g",
      location: "freezer",
      expiration_date: addDays(60),
      min_quantity: null,
      notes: "Chicken breasts - boneless",
    },
    {
      ingredient_id: 32,
      quantity: 300,
      unit: "g",
      location: "freezer",
      expiration_date: addDays(45),
      min_quantity: null,
      notes: "Salmon fillets",
    },
    {
      ingredient_id: 1,
      quantity: 250,
      unit: "g",
      location: "freezer",
      expiration_date: addDays(30),
      min_quantity: null,
      notes: "Raw king prawns",
    },
  ];

  console.log(`📦 Inserting ${inventoryItems.length} inventory items...\n`);

  // Insert each item with upsert
  for (const item of inventoryItems) {
    const { data, error } = await supabase
      .from("user_inventory")
      .upsert(
        {
          user_id: userId,
          ...item,
        },
        {
          onConflict: "user_id,ingredient_id,location",
        }
      )
      .select()
      .single();

    if (error) {
      console.error(`❌ Error inserting item (ingredient_id: ${item.ingredient_id}):`, error.message);
    } else {
      console.log(`✅ ${item.notes || `Item ${item.ingredient_id}`} - ${item.location}`);
    }
  }

  // Fetch and display summary
  console.log("\n📊 Inventory Summary:\n");

  const { data: inventory, error: fetchError } = await supabase
    .from("user_inventory")
    .select(
      `
      *,
      ingredient:Ingredient (name)
    `
    )
    .eq("user_id", userId)
    .order("location")
    .order("expiration_date", { ascending: true, nullsFirst: false });

  if (fetchError) {
    console.error("❌ Error fetching inventory:", fetchError.message);
    return;
  }

  // Group by location
  const byLocation: Record<string, typeof inventory> = {};
  for (const item of inventory || []) {
    const loc = item.location;
    if (!byLocation[loc]) byLocation[loc] = [];
    byLocation[loc].push(item);
  }

  const getStatus = (expDate: string | null): string => {
    if (!expDate) return "∞";
    const exp = new Date(expDate);
    const diff = Math.ceil((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diff < 0) return "🔴 EXPIRED";
    if (diff <= 2) return "🟠 Critical";
    if (diff <= 7) return "🟡 Warning";
    return "🟢 Good";
  };

  for (const [location, items] of Object.entries(byLocation)) {
    console.log(`\n📍 ${location.toUpperCase()}:`);
    for (const item of items || []) {
      const name = (item.ingredient as { name: string })?.name || `ID: ${item.ingredient_id}`;
      const status = getStatus(item.expiration_date);
      const lowStock =
        item.min_quantity && item.quantity <= item.min_quantity ? " ⚠️ LOW" : "";
      console.log(`   - ${name}: ${item.quantity}${item.unit} ${status}${lowStock}`);
    }
  }

  console.log("\n✅ Seed completed successfully!");
}

seedInventory().catch(console.error);
