## 📁 Project Structure

```
project/
├─ api/
│  └─ index.py          # FastAPI entrypoint (used by both local & Vercel)
├─ .env                 # Supabase credentials (local only, ignored by git)
├─ vercel.json          # Vercel deployment config
├─ requirements.txt     # Python dependencies
└─ Makefile             # Local dev shortcuts (optional)
```


## ⚙️ Environment Variables

Create a `.env` file in the project root:

```
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
```

> ⚠️ Do **not** commit `.env` to GitHub.
> Add it to `.gitignore`.

For deployment, add the same variables in your **Vercel Project Settings → Environment Variables**.

---

## 💻 Local Development

### 1. Install dependencies

```bash
pip install -r requirements.txt
```

### 2. Run the app

Option A — using Makefile (recommended):

```bash
make dev
```

Option B — manually:

```bash
python -m uvicorn api.index:app --reload --host 0.0.0.0 --port 8000
```

### 3. Test the API

Visit:
👉 [http://localhost:8000](http://localhost:8000)
or the auto-generated docs at
👉 [http://localhost:8000/docs](http://localhost:8000/docs)


## ☁️ Deployment (Vercel)

### 1. Install the Vercel CLI

```bash
npm i -g vercel
```

### 2. Log in and link the project

```bash
vercel login
vercel link
```

### 3. Deploy

```bash
vercel deploy
```

Vercel will:

* Detect the Python runtime
* Install dependencies from `requirements.txt`
* Use `api/index.py` as the entrypoint
* Inject environment variables automatically


## 🧠 Useful Commands

| Command         | Description                                               |
| --------------- | --------------------------------------------------------- |
| `make dev`      | Run FastAPI locally with Uvicorn                          |
