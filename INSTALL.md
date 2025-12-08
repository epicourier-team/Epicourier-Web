# Installation Guide

## Requirements

*   **Node.js**: v20.0.0 or higher
*   **Python**: v3.10 or higher
*   **pip**: Python package manager

## 1. Clone the Repository

```bash
git clone https://github.com/pranshavpatel/Epicourier-v2.git
cd Epicourier-v2
```

If you plan to contribute, please **fork the repository first**, then add your fork as the `origin` remote. For more details, see **[CONTRIBUTE.md](./CONTRIBUTE.md)**.

---

## 2. Backend Setup (Python)

Navigate to the backend directory and set up the virtual environment.

### Linux/macOS
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### Windows
```bash
cd backend
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
```

### Run Backend Server
```bash
uvicorn api.index:app --reload --port 8000
```

---

## 3. Frontend Setup (Next.js)

Open a new terminal window for the frontend.

```bash
cd web
npm install
```

### Run Frontend Server
```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

---

## 4. Run Tests

### Backend Tests
```bash
cd backend
pytest
```

### Frontend Tests (Jest)
```bash
cd web
npm run test
```
