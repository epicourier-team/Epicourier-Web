# Smart Cart Quick Start Guide

**Epicourier-Web v1.3.0**

---

## Welcome to Smart Cart! 🛒

Smart Cart helps you manage groceries, track inventory, and get AI-powered recipe suggestions. This guide will get you started in 5 minutes.

---

## 🚀 Quick Setup (3 Steps)

### Step 1: Create Your First Shopping List

1. Click **🛒 Shopping** in the sidebar
2. Click **"+ New List"** button
3. Name it "Weekly Groceries"
4. Click **"Create"**

✅ **Done!** You now have a shopping list.

---

### Step 2: Add Items to Inventory

1. Click **📦 Inventory** in the sidebar
2. Click **"+ Add Item"** button
3. Search for an ingredient (e.g., "chicken breast")
4. Set quantity: `500g`
5. Set location: `Fridge`
6. Set expiration: `3 days from now`
7. Click **"Add to Inventory"**

🎯 **Tip**: Add 5-10 items to get better AI suggestions!

---

### Step 3: Get AI Recipe Suggestions

1. Stay on the **Inventory** page
2. Click **"🍳 Suggest Recipes"** (or press `Cmd/Ctrl + R`)
3. Review suggested recipes
4. Click **"View Recipe"** to see full details
5. Click **"Add Missing Items"** to create a shopping list

🤖 **Magic!** The AI finds recipes you can make right now.

---

## 🎯 Key Features at a Glance

| Feature | What It Does | Where to Find It |
|---------|-------------|------------------|
| **Shopping Lists** | Organize grocery shopping | 🛒 Sidebar → Shopping |
| **Inventory Tracking** | Track what you have at home | 📦 Sidebar → Inventory |
| **Recipe Match** | See what recipes you can make | 🍽️ Recipes page (% badge) |
| **AI Suggestions** | Get personalized recipe ideas | Inventory → "Suggest Recipes" |
| **Expiration Alerts** | Avoid food waste | Inventory page banner |

---

## 📱 Common Tasks

### How do I add items to my shopping list?

**Currently**: Manual editing coming in Issue #83  
**Soon**: Click "+ Add Item" → Search ingredient → Set quantity → Save

### How do I mark items as purchased?

**Coming Soon**: Checkboxes on shopping list items (Issue #83)

### How do I see which recipes I can make?

1. Go to **Recipes** page
2. Look for the **percentage badge** on each recipe card:
   - 🟢 **Green (≥80%)**: Can Make Now
   - 🟡 **Yellow (50-79%)**: Partial Match
   - 🔴 **Red (<50%)**: Need Shopping
3. Use **filter buttons** to show only recipes you can make

### How do I transfer shopping items to inventory?

**Coming Soon**: Issue #101 will add "Transfer to Inventory" button

### How do I update inventory quantities?

**Coming Soon**: Issue #88 will add full CRUD operations

---

## 🏆 Pro Tips

### 1. Set Expiration Dates

Always add expiration dates to perishable items:
- The AI prioritizes recipes using expiring ingredients
- You'll get alerts before food goes bad
- Reduces waste and saves money

### 2. Use Keyboard Shortcuts

- `Cmd/Ctrl + R` → Suggest Recipes (from Inventory page)
- `/` → Quick search
- `A` → Add item

### 3. Plan Your Week

1. **Monday**: Check inventory, get AI suggestions
2. **Tuesday**: Plan meals for the week
3. **Wednesday**: Create shopping list
4. **Thursday**: Go shopping
5. **Friday**: Update inventory with new items

### 4. Organize by Location

- **Pantry**: Dry goods (rice, pasta, canned)
- **Fridge**: Perishables (dairy, produce, meat)
- **Freezer**: Long-term storage

This helps with:
- Finding items quickly
- Tracking what's expiring soon
- Meal planning

---

## ❓ Troubleshooting

### "No recipes suggested"

**Cause**: Inventory too small or restrictive preferences  
**Fix**:
- Add at least 5-10 items to inventory
- Check dietary restrictions in Settings
- Broaden preferences

### "Recipe match shows 0%"

**Cause**: Mock data in v1.3.0 (uses random percentages)  
**Fix**: Wait for Issue #88 (real inventory integration)  
**Workaround**: Percentages are for demonstration only

### "Shopping list is empty"

**Cause**: Items not yet added (Issue #83 in progress)  
**Fix**: Wait for item management feature  
**Workaround**: Lists created in #81 are ready for items

---

## 📚 Learn More

### User Guides

- **[Shopping Lists](./shopping-lists.md)** - Full guide with tips
- **[Inventory Management](./inventory-management.md)** - Detailed inventory guide
- **[AI Suggestions](./smart-suggestions.md)** - How the AI works

### Video Tutorials (Coming Soon)

- Creating your first shopping list
- Setting up inventory tracking
- Using AI recipe suggestions
- Reducing food waste with Smart Cart

---

## 🆘 Need Help?

- 💬 **Community Forum**: [GitHub Discussions](https://github.com/sdxshuai/Epicourier-Web/discussions)
- 🐛 **Report Bug**: [GitHub Issues](https://github.com/sdxshuai/Epicourier-Web/issues)
- 📖 **FAQ**: [Frequently Asked Questions](../faq.md)
- 📧 **Email**: support@epicourier.com

---

## 🎉 What's Next?

After completing this guide, try:

1. ✅ Add 10 items to your inventory
2. ✅ Get your first AI suggestions
3. ✅ Create a shopping list for missing ingredients
4. ✅ Explore the recipe match indicator
5. ✅ Set up expiration alerts

**Happy cooking!** 🍳

---

**Last Updated**: December 2025  
**Version**: v1.3.0  
**Estimated Read Time**: 5 minutes
