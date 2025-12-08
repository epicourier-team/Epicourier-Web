[![CI/CD Pipeline](https://github.com/pranshavpatel/Epicourier-v2/actions/workflows/ci.yml/badge.svg)](https://github.com/pranshavpatel/Epicourier-v2/actions/workflows/ci.yml)
[![DOI](https://zenodo.org/badge/DOI/10.5281/zenodo.17852622.svg)](https://doi.org/10.5281/zenodo.17852622)
[![codecov](https://codecov.io/github/epicourier-team/Epicourier-Web/graph/badge.svg?token=TTLT1APZ44)](https://codecov.io/github/epicourier-team/Epicourier-Web)
[![Issues](https://img.shields.io/github/issues/pranshavpatel/Epicourier-v2)](https://github.com/pranshavpatel/Epicourier-v2/issues)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE.md)

[![Pull Requests](https://img.shields.io/github/issues-pr/pranshavpatel/Epicourier-v2)](https://github.com/pranshavpatel/Epicourier-v2/pulls)
[![Contributors](https://img.shields.io/github/contributors/pranshavpatel/Epicourier-v2)](https://github.com/pranshavpatel/Epicourier-v2/graphs/contributors)
[![Last Commit](https://img.shields.io/github/last-commit/pranshavpatel/Epicourier-v2)](https://github.com/pranshavpatel/Epicourier-v2/commits/main)
[![Repo Size](https://img.shields.io/github/repo-size/pranshavpatel/Epicourier-v2)](https://github.com/pranshavpatel/Epicourier-v2)

<!-- Frontend Code Quality Tool Badges -->
[![Code Style: Prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg)](https://github.com/prettier/prettier)
[![Type Checker: TypeScript](https://img.shields.io/badge/type_checker-typescript-blue)](https://www.typescriptlang.org/)
[![Testing: Jest](https://img.shields.io/badge/testing-jest-red)](https://jestjs.io/)

[![Python Version](https://img.shields.io/badge/python-3.10+-blue)](https://www.python.org/)
[![Node Version](https://img.shields.io/badge/node-20+-green)](https://nodejs.org/)
[![FastAPI](https://img.shields.io/badge/framework-fastapi-009688)](https://fastapi.tiangolo.com/)
[![Next.js](https://img.shields.io/badge/framework-next.js-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/typescript-blue)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/database-postgresql-blue)](https://www.postgresql.org/)

<!-- Backend Code Quality Tool Badges -->
[![Linting: Flake8](https://img.shields.io/badge/linting-flake8-yellowgreen)](https://flake8.pycqa.org/)
[![Testing: Pytest](https://img.shields.io/badge/testing-pytest-blue)](https://pytest.org/)

# Epicourier-v2 🍽️✨ — Plan Smart. Shop Less. Eat Better.

## Overview
**Epicourier-v2** is a next-generation meal planning and grocery management platform. It leverages **AI and Vector Search** to provide personalized meal recommendations, auto-generate smart shopping lists, and track pantry inventory. Built with **FastAPI**, **Next.js**, and **PostgreSQL**, it transforms how users plan, shop, and cook.

---

## Intended Users
- **Home Cooks** looking for personalized recipe inspiration.
- **Busy Professionals** who want to automate their grocery shopping.
- **Budget-conscious Shoppers** trying to utilize their existing pantry items.
- **Developers** interested in Agentic AI and Full-Stack Engineering.

---

## 🎯 About the Project
Epicourier-v2 addresses the challenge of "what's for dinner?" by acting as your intelligent nutrition assistant. It aligns meal suggestions with your **ingredients, profile, and personal health goals** to simplify your life.

**Key Objectives:**
- **🥗 Personalized & Goal-Oriented**: AI suggests nutritious meals tailored to your profile, health goals, and pantry inventory.
- **📅 Inspiration & Consistency**: Encourages you to follow your meal calendar consistently through effortless planning.
- **📈 Motivation via Visualization**: Provides rich data visualizations and meal tracking to keep you motivated and aware of your progress.
- **♻️ Minimize Food Waste**: Prioritizes recipes that use ingredients you already have.
- **🛒 Optimize Shopping**: Automatically generates consolidated shopping lists from your meal plan.

---

## 🛠 Tech Stack

### Backend
- **Framework:** FastAPI (Python 3.10+)
- **Database:** PostgreSQL
- **AI/ML:** Google Gemini, LangChain, Sentence Transformers
- **Embedding:** All-MiniLM-L6-v2

### Frontend
- **Framework:** Next.js (TypeScript + Tailwind CSS)
- **UI Components:** Shadcn/UI (Radix Primitives)
- **State Management:** React Context / Hooks
- **Visualization:** Recharts

### DevOps & Tools
- **Testing:** Pytest, Jest
- **Linting:** Ruff, ESLint
- **Version Control:** Git, GitHub Actions

---

## Quick Start

```bash
# Clone the repository
git clone https://github.com/pranshavpatel/Epicourier-v2.git
cd Epicourier-v2

# --- Backend Setup ---
cd backend
# Create virtual environment (Windows)
python -m venv venv
.\venv\Scripts\activate
# Install dependencies
pip install -r requirements.txt
# Run Server
uvicorn api.index:app --reload --port 8000

# --- Frontend Setup ---
# Open a new terminal
cd ../web
npm install
npm run dev
```
**Backend** runs on `http://localhost:8000`  
**Frontend** runs on `http://localhost:3000`

---

## ✨ Features
- **🤖 Vector-Based Recommendation Engine**: Finds recipes semantically similar to your preferences.
- **🛒 Smart Shopping List**: One-click generation of shopping lists based on your weekly meal plan.
- **📊 AI Insights Dashboard**: Visualize your nutritional goals and cooking habits.
- **📅 Interactive Meal Calendar**: Drag-and-drop interface for planning meals.
- **🏠 Digital Pantry**: Track what you have to avoid overbuying.
- **🚗 Deep Linking**: Direct integration (experimental) with delivery services like Uber Eats.

---

## 🧪 Testing and Code Coverage

### Backend
```bash
cd backend
pytest -v
```

### Frontend
```bash
cd web
npm run test
```
*Current coverage: 80%*

---

## 🗺️ Project Roadmap
| Timeline | Milestone |
|-----------|------------|
| **Q1 2026** | Mobile App Development (React Native) |
| **Q2 2026** | Social Features (Share Meal Plans) |

---

## 📚 Documentation
For detailed guides on contributing and setup, please refer to:
- **[Installation Guide](INSTALL.md)**
- **[Contributing Guide](CONTRIBUTE.md)**

---

## 🚀 Deployment
Our app is deployed at `https://epicourier-v2.vercel.app/`. We recommend **Vercel** for the frontend and **Render** for the backend.

---

## 🤝 Contributing
We welcome contributions! Please read our [Code of Conduct](CODE_OF_CONDUCT.md) and [Contributing Guide](CONTRIBUTE.md) before submitting a Pull Request.

---

## 👥 Team
**Developed by:**
- **Pranshav Patel**
- **Namit Patel**
- **Vivek Vanera**
- **Janam Patel**

---

## 📞 Support
If you encounter any issues, please open a [GitHub Issue](https://github.com/pranshavpatel/Epicourier-v2/issues).

---

## 🧾 Funding Statement
This project is currently a **self-funded volunteer initiative**.
We welcome to help us scale! See [FUNDING.md](FUNDING.md) for details.

---

## 📄 License
Licensed under the **MIT License**. See [LICENSE.md](LICENSE.md) for details.

---

## 📜 Citation
```bibtex
@software{Epicourier_v2_2025,
  author = {Patel, Janam; Patel, Namit; Patel, Pranshav; Vanera, Vivek;},
  title = {Epicourier-v2: AI-Powered Meal Planning System},
  year = {2025},
  url = {https://github.com/pranshavpatel/Epicourier-v2}
}
```

*Plan Smart. Shop Less. Eat Better.* 🥗🛒
