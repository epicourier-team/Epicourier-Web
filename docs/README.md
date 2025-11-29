# Smart Cart Documentation

**Epicourier-Web v1.3.0**

Welcome to the Smart Cart documentation hub. This directory contains comprehensive guides for using and developing the Smart Cart features.

---

## 📚 Documentation Structure

```
docs/
├── user-guides/              # User-facing documentation
│   ├── quick-start.md        # 5-minute getting started guide
│   ├── shopping-lists.md     # Shopping list feature guide
│   ├── inventory-management.md  # Inventory tracking guide
│   └── smart-suggestions.md  # AI recipe recommendations guide
│
├── api/                      # API reference documentation
│   ├── shopping-list-api.md  # Shopping list endpoints (TODO)
│   ├── inventory-api.md      # Inventory endpoints (TODO)
│   └── recommendation-api.md # AI recommendation API (TODO)
│
├── developer/                # Developer documentation
│   ├── setup.md              # Development environment (TODO)
│   ├── architecture.md       # System architecture (TODO)
│   └── testing.md            # Testing guide (TODO)
│
└── releases/                 # Release notes
    └── v1.3.0.md             # Smart Cart release notes
```

---

## 🚀 Getting Started

### For Users

Start with these guides:

1. **[Quick Start Guide](./user-guides/quick-start.md)** ⚡
   - 5-minute setup
   - Essential features
   - Common tasks
   - **Start here if you're new!**

2. **[Shopping Lists Guide](./user-guides/shopping-lists.md)** 🛒
   - Creating and managing lists
   - Adding items
   - Sharing and exporting

3. **[Inventory Management Guide](./user-guides/inventory-management.md)** 📦
   - Tracking ingredients
   - Expiration alerts
   - Recipe match indicator

4. **[AI Recipe Suggestions Guide](./user-guides/smart-suggestions.md)** 🤖
   - Getting personalized recommendations
   - Understanding the AI algorithm
   - Custom preferences

### For Developers

1. **[v1.3.0 Release Notes](./releases/v1.3.0.md)** 📋
   - Complete changelog
   - New features
   - Breaking changes
   - Migration guide

2. **API Documentation** (Coming Soon) 🔌
   - REST API endpoints
   - Request/response formats
   - Authentication
   - Error handling

3. **Architecture Documentation** (Coming Soon) 🏗️
   - System design
   - Database schema
   - Frontend patterns
   - Backend patterns

---

## 🎯 Feature Overview

### Shopping Lists (v1.3.0)

✅ **Implemented**:
- Create, edit, delete shopping lists
- Multiple lists support
- Undo delete (10-second window)
- Neo-Brutalism UI design

🚧 **In Progress**:
- Item management (#83)
- Auto-generate from calendar (#80)
- Export functionality (#84)

### Inventory Management (v1.3.0)

✅ **Implemented**:
- Inventory page skeleton
- "Suggest Recipes" button
- Keyboard shortcut (Cmd/Ctrl+R)

🚧 **In Progress**:
- Full CRUD operations (#88)
- Expiration tracking (#87, #89)
- Low stock alerts (#90)

### Recipe Match Indicator (v1.3.0)

✅ **Implemented**:
- Percentage badge on recipe cards
- Color-coded indicators (green/yellow/red)
- Filter by match level
- Sort by match percentage

🔄 **Note**: Currently uses mock data, real inventory integration pending (#88)

### AI Recommendations (v1.3.0)

✅ **Backend Ready**:
- Python API endpoint
- Coverage score algorithm
- Expiration priority
- Google Gemini integration

🚧 **Frontend Pending**:
- Recommendation modal (#94)
- "Add missing items" action (#97)

---

## 📖 User Guide Index

| Guide | Topics Covered | Estimated Read Time |
|-------|---------------|-------------------|
| [Quick Start](./user-guides/quick-start.md) | Setup, key features, common tasks | 5 min |
| [Shopping Lists](./user-guides/shopping-lists.md) | Creating lists, adding items, sharing | 10 min |
| [Inventory](./user-guides/inventory-management.md) | Tracking items, expiration alerts, match indicator | 15 min |
| [AI Suggestions](./user-guides/smart-suggestions.md) | Getting recommendations, AI algorithm, preferences | 12 min |

**Total Reading Time**: ~42 minutes to master all features

---

## 🛠️ Developer Resources

### Quick Links

- **[GitHub Repository](https://github.com/sdxshuai/Epicourier-Web)**
- **[Issue Tracker](https://github.com/sdxshuai/Epicourier-Web/issues)**
- **[Project Board](https://github.com/users/sdxshuai/projects/1)**
- **[Wiki](https://github.com/sdxshuai/Epicourier-Web/wiki)**

### Related Documentation

Located in `AGENT-PLAN/`:
- **[00-QUICK-START.md](../AGENT-PLAN/00-QUICK-START.md)** - Project overview
- **[01-TECH-STACK.md](../AGENT-PLAN/01-TECH-STACK.md)** - Technology choices
- **[02-ARCHITECTURE.md](../AGENT-PLAN/02-ARCHITECTURE.md)** - System architecture
- **[03-API-SPECIFICATIONS.md](../AGENT-PLAN/03-API-SPECIFICATIONS.md)** - API design
- **[04-DATABASE-DESIGN.md](../AGENT-PLAN/04-DATABASE-DESIGN.md)** - Database schema
- **[v1.3.0-SMART-CART-PLAN.md](../AGENT-PLAN/v1.3.0-SMART-CART-PLAN.md)** - Sprint planning

---

## 🐛 Reporting Issues

Found a bug or have a feature request?

1. Check [existing issues](https://github.com/sdxshuai/Epicourier-Web/issues)
2. If not found, [create a new issue](https://github.com/sdxshuai/Epicourier-Web/issues/new)
3. Use the appropriate template:
   - 🐛 Bug Report
   - ✨ Feature Request
   - 📖 Documentation Improvement

---

## 🤝 Contributing

Want to contribute to Smart Cart?

1. Read [CONTRIBUTE.md](../CONTRIBUTE.md)
2. Check [open issues](https://github.com/sdxshuai/Epicourier-Web/issues?q=is%3Aissue+is%3Aopen+label%3Av1.3.0)
3. Fork the repository
4. Create a feature branch
5. Submit a pull request

**Good first issues**:
- Documentation improvements
- UI polish
- Test coverage
- Bug fixes

---

## 📞 Support

### Getting Help

- 💬 **Community Forum**: [GitHub Discussions](https://github.com/sdxshuai/Epicourier-Web/discussions)
- 📧 **Email Support**: support@epicourier.com
- 🐛 **Bug Reports**: [GitHub Issues](https://github.com/sdxshuai/Epicourier-Web/issues)

### FAQ

**Q: Where is the API documentation?**  
A: API docs are coming soon in `docs/api/`. For now, see code comments in `web/src/app/api/` and `backend/api/`.

**Q: How do I run Smart Cart locally?**  
A: See [INSTALL.md](../INSTALL.md) for setup instructions.

**Q: What's the difference between Shopping Lists and Inventory?**  
A: Shopping Lists are for *planning* what to buy. Inventory is for *tracking* what you already have at home.

**Q: Why does the recipe match indicator show random percentages?**  
A: In v1.3.0, it uses mock data for demonstration. Real inventory integration is coming in Issue #88.

---

## 🗺️ Roadmap

### v1.3.1 (Next Minor Release)

**High Priority**:
- [ ] Shopping list item management (#83)
- [ ] Full inventory CRUD (#88)
- [ ] AI recommendation modal (#94)
- [ ] Dashboard Smart Cart widget (#100)

**Medium Priority**:
- [ ] Add to shopping list from recipe page (#96)
- [ ] Calendar quick-add (#97)
- [ ] Shopping → Inventory transfer (#101)

**Low Priority**:
- [ ] E2E tests (#103)
- [ ] Export functionality (#84)
- [ ] Performance optimization (#102)

### v1.4.0 (Future)

- [ ] Meal planning AI
- [ ] Grocery delivery integration
- [ ] Barcode scanning (mobile app)
- [ ] Recipe scaling based on inventory
- [ ] Family sharing features

---

## 📊 Metrics & Analytics

### Usage Statistics

*(Will be added post-release)*

- Number of shopping lists created
- Average inventory size
- AI suggestion usage
- Recipe match filter usage

### Performance Metrics

- Page load times
- API response times
- Database query performance
- Mobile responsiveness scores

---

## 🎉 Acknowledgments

### Contributors

Special thanks to:
- **sdxshuai** - Project Lead
- **AI Agent** - Feature implementation
- **Community** - Beta testing feedback

### Technologies

Smart Cart is built with:
- **Frontend**: Next.js 15, React 19, TypeScript 5, Tailwind CSS
- **Backend**: FastAPI (Python), Google Gemini
- **Database**: Supabase (PostgreSQL)
- **UI Library**: shadcn/ui, lucide-react

---

## 📜 License

This documentation and the Smart Cart features are part of the Epicourier-Web project, licensed under the [MIT License](../LICENSE.md).

---

## 📝 Documentation Updates

This documentation is actively maintained. Last updates:

| Section | Last Updated | Version |
|---------|-------------|---------|
| Quick Start | Dec 2025 | v1.3.0 |
| Shopping Lists | Dec 2025 | v1.3.0 |
| Inventory | Dec 2025 | v1.3.0 |
| AI Suggestions | Dec 2025 | v1.3.0 |
| Release Notes | Dec 2025 | v1.3.0 |

To suggest documentation improvements, open an issue with the `documentation` label.

---

**Last Updated**: December 2025  
**Documentation Version**: v1.3.0  
**Maintained By**: Epicourier Team
