# AI Recipe Suggestions User Guide

**Epicourier-Web v1.3.0**

---

## Overview

The AI Recipe Suggestions feature uses your current inventory to recommend recipes you can make right now. The system prioritizes ingredients that are expiring soon to help reduce food waste.

---

## How It Works

### The Algorithm

1. **Inventory Analysis**: Reviews all ingredients in your inventory
2. **Coverage Calculation**: For each recipe in the database:
   - Calculates what percentage of ingredients you have
   - Identifies missing ingredients
3. **Expiration Priority**: Boosts recipes that use expiring ingredients
4. **Diversity Filtering**: Uses ML clustering to ensure variety
5. **Ranking**: Returns top recipes sorted by:
   - Coverage score (how much you can make)
   - Expiration urgency
   - Your preferences (dietary restrictions)

---

## Getting Suggestions

### From Inventory Page

1. Navigate to **Inventory** (📦 icon in sidebar)
2. Click the **"🍳 Suggest Recipes"** button in the header
3. **Or** press keyboard shortcut: `Cmd/Ctrl + R`
4. Wait for AI to analyze your inventory (usually 2-3 seconds)
5. Review suggested recipes in the modal

### From Dashboard Widget (Coming Soon)

- The Smart Cart widget will show:
  - "3 recipes you can make now"
  - Click to see full suggestions

---

## Understanding Recommendations

### Recipe Cards

Each suggested recipe shows:

```
┌─────────────────────────────────────────────────┐
│ 1. Chicken Stir Fry                ★ 95% match │
│                                                 │
│ ✅ Uses expiring: chicken breast (2 days)      │
│ ❌ Missing: soy sauce, sesame oil              │
│                                                 │
│ AI Reasoning: "This recipe uses your expiring  │
│ chicken breast and most vegetables you have."  │
│                                                 │
│ [View Recipe] [Add Missing to Shopping List]   │
└─────────────────────────────────────────────────┘
```

**Key Information**:

- **Match Percentage**: How much of the recipe you can make
  - **≥80%**: High match (green) - Can make now!
  - **50-79%**: Partial match (yellow) - Need a few items
  - **<50%**: Low match (red) - Many items missing

- **Expiring Ingredients**: Highlights which expiring items are used
  - Shows days until expiration
  - Helps prioritize what to cook first

- **Missing Ingredients**: Lists what you need to buy
  - Click "Add to Shopping List" to create a list instantly

- **AI Reasoning**: Explains why this recipe was suggested
  - Uses natural language from Google Gemini
  - Considers your preferences and dietary restrictions

---

## Filtering Suggestions

### By Match Level

Use the filter buttons to narrow results:

- **All**: Show all suggestions
- **Can Make Now** (≥80%): Only recipes you have most ingredients for
- **Partial Match** (50-79%): Recipes needing a few items
- **Need Shopping** (<50%): Recipes requiring more shopping

### By Dietary Preferences

Set preferences in **Settings → Profile**:

- Vegetarian
- Vegan
- Gluten-free
- Dairy-free
- Nut-free

The AI will only suggest recipes matching your restrictions.

---

## Actions from Suggestions

### View Recipe

1. Click **"View Recipe"** on any suggestion card
2. Opens the full recipe detail page
3. See full ingredients list, instructions, and nutrition info

### Add Missing Ingredients to Shopping List

1. Click **"Add Missing to Shopping List"**
2. Choose an existing list or create a new one
3. All missing ingredients are added with estimated quantities
4. Navigate to Shopping Lists to review before shopping

### Add to Meal Calendar

1. Click **"Add to Calendar"** (if available)
2. Select date and meal type (breakfast/lunch/dinner)
3. Recipe is scheduled in your calendar

---

## Advanced Features

### Custom Preferences

In the suggestions modal:

1. Click **"⚙️ Customize"**
2. Add text preferences:
   - "I want something spicy"
   - "Quick recipes under 30 minutes"
   - "Kid-friendly meals"
3. Click **"Refresh Suggestions"**
4. AI will re-analyze with your preferences

### Expiration Priority Toggle

Control how much the AI prioritizes expiring items:

- **High Priority**: Only recipes using expiring ingredients
- **Balanced** (default): Mix of expiring and flexible recipes
- **Low Priority**: Focus on coverage, ignore expiration dates

---

## Tips for Best Results

### Maintain Accurate Inventory

✅ **Update regularly**: Keep inventory current for accurate suggestions  
✅ **Set expiration dates**: Enables expiration priority  
✅ **Track quantities**: Better coverage calculations  

### Diversify Inventory

🌈 **Variety**: More ingredients = more recipe options  
🧂 **Staples**: Keep basics like oil, salt, spices stocked  
🥫 **Pantry essentials**: Rice, pasta, canned goods increase versatility  

### Use Suggestions Proactively

📅 **Weekly Planning**: Get suggestions at start of week  
🍳 **Before Shopping**: See what you can make before buying more  
⏰ **Expiration Alerts**: Check suggestions when items are expiring  

---

## Understanding the AI

### Coverage Score Calculation

```
Coverage Score = (Available Ingredients / Total Recipe Ingredients) × 100%

Example:
Recipe needs: chicken, rice, soy sauce, garlic, ginger (5 ingredients)
You have: chicken, rice, garlic (3 ingredients)
Coverage = 3/5 = 60%
```

### Expiration Bonus

```
Base Score = Coverage Score
Expiration Bonus:
  - Critical (≤2 days): +30% boost
  - Warning (3-7 days): +10% boost

Final Score = Base Score + Expiration Bonus (capped at 100%)
```

### Diversity Filtering

Uses **K-Means clustering** on recipe embeddings to ensure:
- Not all suggestions are the same cuisine
- Variety in cooking methods
- Different meal types (light vs. heavy)

---

## Comparison with Other Features

### AI Suggestions vs. Recipe Search

| Feature | AI Suggestions | Recipe Search |
|---------|---------------|---------------|
| **Input** | Your inventory | Keywords, filters |
| **Goal** | Use what you have | Find specific recipes |
| **Personalization** | High (based on you) | Low (generic) |
| **Expiration Aware** | ✅ Yes | ❌ No |

### AI Suggestions vs. Manual Browse

| Aspect | AI Suggestions | Manual Browse |
|--------|---------------|---------------|
| **Speed** | Instant (AI-powered) | Manual filtering |
| **Accuracy** | Match % shown | Guess from image |
| **Waste Reduction** | Prioritizes expiring | No awareness |
| **Effort** | One click | Multiple steps |

---

## API Details (for Developers)

The suggestions are powered by the Python FastAPI backend:

**Endpoint**: `POST /inventory-recommend`

**Request**:
```json
{
  "inventory": [
    {
      "ingredient_id": 123,
      "quantity": 500,
      "expiration_date": "2025-12-05"
    }
  ],
  "preferences": "vegetarian, spicy",
  "num_recipes": 5
}
```

**Response**:
```json
{
  "recipes": [
    {
      "recipe_id": 456,
      "recipe_name": "Spicy Tofu Stir Fry",
      "recipe_image": "https://...",
      "coverage_score": 0.85,
      "missing_ingredients": ["soy sauce"],
      "uses_expiring": [
        {
          "name": "tofu",
          "expires_in_days": 2
        }
      ],
      "reasoning": "Uses your expiring tofu..."
    }
  ],
  "summary": "Found 5 recipes you can make..."
}
```

See [API Documentation](../api/recommendation-api.md) for full details.

---

## Troubleshooting

### No Suggestions Appearing

**Possible Causes**:
- Inventory is empty or too small (<3 items)
- All ingredients are uncommon/rare
- Dietary restrictions too narrow

**Solutions**:
- Add more items to inventory
- Broaden dietary preferences
- Try "Custom Preferences" with flexible requirements

### Suggestions Don't Match Preferences

- Double-check Settings → Profile → Dietary Preferences
- Use "Custom Preferences" field in modal
- Report inaccurate suggestions (feedback helps improve AI)

### Missing Ingredients Are Incorrect

- Verify ingredient names in inventory
- Check for duplicates (e.g., "tomato" vs "tomatoes")
- Update ingredient aliases in Settings

### Slow Response Time

- Large inventories (>100 items) take longer
- Check internet connection
- Try reducing `num_recipes` parameter

---

## Privacy & Data

### What Data Is Used?

- Your inventory items (ingredient IDs, quantities, expiration dates)
- Dietary preferences from profile
- Optional custom preferences text

### What Data Is Stored?

- Suggestion history (for improving recommendations)
- Feedback ratings (if you rate suggestions)

### What Data Is Shared?

- Ingredient data sent to Google Gemini API for natural language reasoning
- No personal info (name, email) is shared
- All data is encrypted in transit (HTTPS)

See [Privacy Policy](../privacy.md) for full details.

---

## Feedback & Improvement

### Rate Suggestions

After trying a recipe:

1. Return to the suggestion modal
2. Click the star rating (1-5 stars)
3. Optional: Add comments
4. Submit feedback

Your ratings help improve:
- Coverage score accuracy
- Expiration priority weighting
- AI reasoning quality

### Report Issues

If suggestions are consistently poor:

1. Click **"Report Issue"**
2. Describe the problem
3. Include:
   - Your inventory size
   - Dietary restrictions
   - Example bad suggestions
4. Our team will investigate

---

## Related Features

- **[Inventory Management](./inventory-management.md)**: Track your ingredients
- **[Recipe Match Indicator](./recipe-browsing.md#match-indicator)**: See match % on all recipes
- **[Shopping Lists](./shopping-lists.md)**: Add missing ingredients

---

## Need Help?

- 📖 [FAQ](../faq.md)
- 💬 [Community Forum](https://github.com/sdxshuai/Epicourier-Web/discussions)
- 🐛 [Report a Bug](https://github.com/sdxshuai/Epicourier-Web/issues)
- 📚 [API Documentation](../api/recommendation-api.md)

---

**Last Updated**: December 2025  
**Version**: v1.3.0
