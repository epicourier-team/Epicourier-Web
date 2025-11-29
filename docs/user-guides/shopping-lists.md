# Shopping Lists User Guide

**Epicourier-Web v1.3.0**

---

## Overview

Shopping Lists help you organize your grocery shopping by creating, managing, and sharing ingredient lists. You can manually add items or auto-generate lists from your meal calendar.

---

## Getting Started

### Creating a Shopping List

1. Navigate to **Shopping Lists** from the sidebar menu (🛒 icon)
2. Click the **"+ New List"** button in the top-right corner
3. Enter a name for your list (e.g., "Weekly Groceries", "Weekend BBQ")
4. Optionally add a description
5. Click **"Create"** to save

Your new shopping list will appear in the grid view.

---

## Managing Lists

### Viewing Lists

- All your shopping lists are displayed in a card grid layout
- Each card shows:
  - **List name** and description
  - **Creation date**
  - Number of items (coming soon)
  - Edit and Delete buttons

### Editing a List

1. Click the **pencil icon** (Edit) on any list card
2. Update the name or description
3. Click **"Save Changes"**

### Deleting a List

1. Click the **trash icon** (Delete) on any list card
2. Confirm deletion in the dialog
3. **Undo Option**: A toast notification will appear with an "Undo" button for 10 seconds

> **Note**: Deleted lists are archived, not permanently removed. Contact support if you need to restore an archived list.

---

## Working with Items

### Adding Items Manually

1. Open a shopping list
2. Click **"+ Add Item"**
3. Start typing an ingredient name
4. Select from autocomplete suggestions (from our ingredient database)
5. Set quantity and unit (e.g., "500g", "2 cups")
6. Optionally add notes
7. Click **"Add"**

### Auto-Generate from Calendar (Coming Soon)

Generate a shopping list from your meal calendar:

1. Select a date range on the calendar (e.g., next week)
2. Click **"Generate Shopping List"**
3. The system will:
   - Collect all recipes from selected meals
   - Extract ingredients from each recipe
   - **Aggregate duplicates** (e.g., 2 recipes need chicken → combine quantities)
   - Create a single shopping list

### Checking Items Off

While shopping:

1. Tap the checkbox next to each item as you add it to your cart
2. Checked items move to the bottom of the list
3. Progress is saved automatically

### Editing Items

- **Quantity**: Click on quantity to edit inline
- **Remove**: Swipe left (mobile) or click the trash icon

---

## Advanced Features

### Sharing Lists (Coming Soon)

1. Open a shopping list
2. Click the **"Share"** button
3. Choose sharing method:
   - **Email**: Enter recipient's email
   - **Link**: Generate a shareable link
4. Set permissions:
   - **View only**: Recipients can see the list
   - **Edit**: Recipients can add/remove items

### Exporting Lists

Export your list for offline use:

1. Open a shopping list
2. Click **"Export"** dropdown
3. Choose format:
   - **Print**: Opens print-friendly view
   - **Copy Text**: Copies plain text to clipboard

### Categories (Coming Soon)

Organize items by category:

- Produce 🥬
- Dairy 🥛
- Meat 🥩
- Pantry 🥫
- Frozen ❄️

Lists will auto-sort by category in the order you typically navigate through the store.

---

## Tips & Best Practices

### Efficient Shopping

- ✅ Check items off as you shop to track progress
- 📍 Use location tags (aisle numbers) for faster navigation
- 🗂️ Enable category sorting for organized shopping

### Smart List Management

- **Weekly Lists**: Create a recurring list for staple items
- **Event Planning**: Separate lists for special occasions
- **Budget Tracking**: Add price estimates in notes field

### Calendar Integration

- Generate lists at the start of each week
- Review and adjust quantities before shopping
- Mark recipes as "added to cart" after shopping

---

## Troubleshooting

### Items Not Showing Up

- Ensure you're viewing the correct list
- Check if filters are applied
- Try refreshing the page

### Autocomplete Not Working

- Check your internet connection
- Clear browser cache
- Search using alternate names (e.g., "tomato" vs "tomatoes")

### Sync Issues with Shared Lists

- Ensure all collaborators have accepted the invite
- Check if permissions are set correctly
- Refresh the page to see latest changes

---

## Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| New List | `Ctrl/Cmd + N` |
| Add Item | `A` (when viewing list) |
| Check Item | `Space` (when item focused) |
| Search | `/` |

---

## Related Features

- **[Inventory Management](./inventory-management.md)**: Transfer checked items to your inventory
- **[Calendar Integration](./calendar-integration.md)**: Auto-generate lists from planned meals
- **[AI Recommendations](./smart-suggestions.md)**: Get recipe suggestions from your shopping list

---

## Need Help?

- 📖 [FAQ](../faq.md)
- 💬 [Community Forum](https://github.com/sdxshuai/Epicourier-Web/discussions)
- 🐛 [Report a Bug](https://github.com/sdxshuai/Epicourier-Web/issues)

---

**Last Updated**: December 2025  
**Version**: v1.3.0
