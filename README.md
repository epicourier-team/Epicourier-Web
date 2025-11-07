# Epicourier-Web

A full-stack meal planning and grocery management web app powered by **Next.js**, **FastAPI**, and **Supabase**.  
This repository hosts the **frontend** (Next.js + TypeScript + Tailwind CSS) and connects seamlessly to the backend API for AI-powered recommendations.

[![DOI](https://zenodo.org/badge/DOI/10.5281/zenodo.17537732.svg)](https://doi.org/10.5281/zenodo.17537732)
[![codecov](https://codecov.io/github/epicourier-team/Epicourier-Web/graph/badge.svg?token=TTLT1APZ44)](https://codecov.io/github/epicourier-team/Epicourier-Web)

## 🎬 Demo Video
[![Demo Video](https://img.youtube.com/vi/R2pvrWlpgaU/maxresdefault.jpg)](https://youtu.be/R2pvrWlpgaU)
<br>
**[Watch the demo on YouTube »](https://youtu.be/R2pvrWlpgaU)**

---

## 🧩 Tech Stack

### 🌐 Web App (Frontend)
Built with a modern TypeScript-based stack for reliability, scalability, and developer productivity.

| Category | Tools |
|-----------|-------|
| Framework | [![Next.js](https://img.shields.io/badge/Next.js-black?logo=next.js&logoColor=white)](#) |
| Styling | [![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-%2338B2AC.svg?logo=tailwind-css&logoColor=white)](#) |
| Language | [![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=fff)](#) |
| Code Syntax Checker | [![ESLint](https://img.shields.io/badge/ESLint-3A33D1?logo=eslint&logoColor=fff)](#) |
| Code Style Checker | [![Prettier](https://img.shields.io/badge/Prettier-1A2C34?logo=prettier&logoColor=F7BA3E)](#) |
| Testing | [![Jest](https://img.shields.io/badge/Jest-C21325?logo=jest&logoColor=fff)](#) |

---

### ⚙️ Backend (FastAPI Service)
Serves model inference, powered by FastAPI.

| Category | Tools |
|-----------|-------|
| Language | [![Python](https://img.shields.io/badge/Python-3776AB?logo=python&logoColor=fff)](#) |
| Framework | [![FastAPI](https://img.shields.io/badge/FastAPI-009485.svg?logo=fastapi&logoColor=white)](#) |
| Model | ![Google Gemini](https://img.shields.io/badge/google%20gemini-8E75B2?logo=google%20gemini&logoColor=white) ![HuggingFace](https://img.shields.io/badge/-HuggingFace-FDEE21?logo=HuggingFace&logoColor=black) |
| Testing | [![Pytest](https://img.shields.io/badge/Pytest-fff?logo=pytest&logoColor=000)](#) |
| Automated Analysis Tool | [![Ruff](https://img.shields.io/endpoint?url=https://raw.githubusercontent.com/astral-sh/ruff/main/assets/badge/v2.json)](https://github.com/astral-sh/ruff) |

---

## 🧪 Coverage
Code coverage is automatically tracked via **Codecov**:

[![codecov](https://codecov.io/github/epicourier-team/Epicourier-Web/graph/badge.svg?token=TTLT1APZ44)](https://codecov.io/github/epicourier-team/Epicourier-Web)

---

## 📊 Dataset
For details about dataset construction and preprocessing, please refer to:
👉 [data/README.md](data/README.md)

---

## 📜 Citation
If you use this repository or dataset in your work, please cite it as:

> Epicourier Team. (2025). *Epicourier-Web* [Computer software]. Zenodo.  
> [https://doi.org/10.5281/zenodo.17537732](https://doi.org/10.5281/zenodo.17537732)

Related publications:
- *(No related publications yet — if you publish one, please let us know!)*

---

## 📎 License
This project is released under the [MIT License](LICENSE).

---

## 📘 Documentation

More details and technical notes are available in the [Wiki Documentation](https://github.com/epicourier-team/Epicourier-Web/wiki).


---

## Commands

### Generate list of third-party dependencies for NextJS project
```bash
node scripts/generate-third-party-list.js
```
You can check the output in [THIRD_PARTY_LIBRARIES.md](/THIRD_PARTY_LIBRARIES.md)