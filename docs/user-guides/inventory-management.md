# Inventory Management User Guide

**Epicourier-Web v1.3.0**

---

## Overview

Inventory Management helps you track ingredients at home, monitor expiration dates, and avoid food waste. The system intelligently suggests recipes based on what you have available and prioritizes items that expire soon.

---

## Getting Started

### Accessing Inventory

1. Navigate to **Inventory** from the sidebar menu (📦 icon)
2. You'll see a grid view of all your tracked ingredients
3. Items are organized by location: Pantry, Fridge, Freezer

---

## Adding Items

### Manual Entry

1. Click the **"+ Add Item"** button
2. **Search for ingredient**:
   - Start typing the ingredient name
   - Select from autocomplete suggestions
3. **Set details**:
   - **Quantity**: Amount you have (e.g., 500)
   - **Unit**: g, kg, ml, L, cups, etc.
   - **Location**: Pantry / Fridge / Freezer / Other
   - **Expiration Date**: Select date (optional but recommended)
   - **Min Quantity**: Alert threshold for low stock (optional)
   - **Notes**: Storage tips, opened date, etc.
4. Click **"Add to Inventory"**

### Quick Add from Shopping List (Coming Soon)

After shopping:

1. Open your completed shopping list
2. Check items you purchased
3. Click **"Transfer to Inventory"**
4. Confirm quantities and expiration dates
5. Items are moved to your inventory automatically

---

## Managing Inventory

### Viewing by Location

Use location tabs to filter:

- **🥫 Pantry**: Dry goods, canned items, spices
- **❄️ Fridge**: Dairy, produce, leftovers
- **🧊 Freezer**: Frozen meats, vegetables, prepared meals
- **📦 All**: View everything at once

### Editing Items

1. Click on an inventory card
2. Update any field (quantity, location, expiration)
3. Click **"Save Changes"**

**Quick Updates**:
- **Increase quantity**: Click the **+** button
- **Decrease quantity**: Click the **-** button
- **Mark as used**: Click **"Use"** to remove from inventory

### Deleting Items

1. Click the **trash icon** on an item card
2. Confirm deletion
3. Item is removed from inventory

---

## Expiration Tracking

### Expiration Alerts

Items are color-coded by urgency:

- 🔴 **Red (Critical)**: Expires within 2 days
- 🟡 **Yellow (Warning)**: Expires within 7 days
- 🟢 **Green (Good)**: More than 7 days / No expiration

### Expiring Soon Banner

At the top of the inventory page:

```
⚠️ 3 items expiring soon - View Details
```

Click to see:
- Which items are expiring
- How many days remaining
- Suggested recipes using those ingredients

### Dashboard Widget

The **Inventory Summary** widget on your dashboard shows:

- Total items tracked
- Expiring soon count
- Low stock alerts

---

## Smart Features

### Recipe Match Indicator (Issue #91)

When browsing recipes, you'll see a **percentage badge** showing how much of the recipe you can make with your current inventory:

- **Green (≥80%)**: "Can Make Now" - You have most ingredients
- **Yellow (50-79%)**: "Partial Match" - Need a few items
- **Red (<50%)**: "Need Shopping" - Missing many ingredients

**Filter recipes by match level**:
1. Go to the **Recipes** page
2. Use the **Match Filter** buttons:
   - Can Make Now (≥80%)
   - Partial Match (50-79%)
   - Need Shopping (<50%)

### AI Recipe Suggestions

Get personalized recipe recommendations:

1. Navigate to the **Inventory** page
2. Click **"🍳 Suggest Recipes"** button (or press `Cmd/Ctrl + R`)
3. The AI will:
   - Analyze your available ingredients
   - Prioritize items expiring soon
   - Recommend recipes with high ingredient coverage
4. Review suggested recipes in the modal
5. Click **"Add Missing Items"** to create a shopping list

**How it works**:
- **Coverage Score**: Percentage of recipe ingredients you have
- **Expiring Priority**: Recipes using expiring items rank higher
- **Missing Ingredients**: Shows what you need to buy

---

## Low Stock Alerts

### Setting Minimum Quantities

For staple ingredients:

1. Edit an inventory item
2. Set **"Min Quantity"** (e.g., 200g for flour)
3. You'll be alerted when stock falls below this level

### Low Stock Notifications

When inventory is low:

- 📊 Dashboard widget shows "Low Stock: 4 items"
- 🛒 Suggestion to add to shopping list
- 📧 Optional email notifications (Settings)

---

## Advanced Features

### Search & Filter

**Search Bar**:
- Search by ingredient name
- Real-time filtering

**Filters**:
- **Location**: Pantry, Fridge, Freezer
- **Expiration**: Expiring within X days
- **Low Stock**: Items below minimum quantity

### Bulk Actions

Select multiple items to:

- Update location (e.g., move fridge → freezer)
- Set expiration dates in batch
- Delete multiple items

### Import/Export

**Export**:
1. Click **"Export Inventory"**
2. Choose format: CSV, JSON, or PDF
3. Use for backups or sharing with family

**Import**:
1. Click **"Import"**
2. Upload CSV file (template provided)
3. Review and confirm import

---

## Best Practices

### Organization Tips

✅ **Use Locations Consistently**:
- Pantry: Non-perishables (rice, pasta, canned goods)
- Fridge: Perishables (dairy, produce, meat)
- Freezer: Long-term storage

✅ **Set Expiration Dates**:
- Fresh produce: 3-7 days
- Dairy: Check package
- Opened items: Note opened date in notes

✅ **Regular Audits**:
- Weekly: Check expiring items
- Monthly: Review low stock
- Quarterly: Full inventory audit

### Reducing Food Waste

🌱 **Use AI Suggestions**: Prioritize recipes with expiring ingredients  
📅 **Plan Meals**: Check inventory before meal planning  
❄️ **Freeze Before Expiring**: Move items to freezer to extend life  
🍽️ **Batch Cooking**: Use up multiple expiring items at once

### Meal Planning Integration

1. **Check Inventory First**: See what you have before planning
2. **Plan Around Expiring Items**: Use recipes suggested by AI
3. **Create Shopping List**: For missing ingredients
4. **Update After Shopping**: Transfer purchases to inventory

---

## Troubleshooting

### Items Not Appearing

- Check location filter (are you viewing "Fridge" when item is in "Pantry"?)
- Ensure item wasn't accidentally deleted
- Refresh the page

### Incorrect Expiration Dates

- Edit the item and update the date
- Check if timezone is set correctly (Settings → Profile)

### Sync Issues

- Ensure stable internet connection
- Try logging out and back in
- Contact support if issue persists

---

## Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Add Item | `A` |
| Search | `/` |
| Suggest Recipes | `Cmd/Ctrl + R` |
| Filter by Location | `1-4` |

---

## Related Features

- **[Shopping Lists](./shopping-lists.md)**: Create lists for missing ingredients
- **[AI Recommendations](./smart-suggestions.md)**: Get recipes from inventory
- **[Recipe Match Indicator](./recipe-browsing.md#match-indicator)**: See what you can make

---

## Need Help?

- 📖 [FAQ](../faq.md)
- 💬 [Community Forum](https://github.com/sdxshuai/Epicourier-Web/discussions)
- 🐛 [Report a Bug](https://github.com/sdxshuai/Epicourier-Web/issues)

---

**Last Updated**: December 2025  
**Version**: v1.3.0
