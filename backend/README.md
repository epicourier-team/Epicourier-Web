## 📁 Project Structure

```

project/
├─ api/
│  └─ index.py          # FastAPI entrypoint
├─ .env                 # Supabase + Backend config (ignored by git)
├─ .env                 # Supabase + Backend config (ignored by git)
├─ pyproject.toml       # Python dependencies and config
├─ uv.lock              # Dependency lock file
└─ Makefile             # Local dev shortcuts (optional)

```

---

## ⚙️ Environment Variables

Create a `.env` file in the project root:

```

NEXT_PUBLIC_SUPABASE_URL=[https://YOUR_PROJECT.supabase.co](https://YOUR_PROJECT.supabase.co)
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY

# Backend API base URL

BACKEND_URL=[http://localhost:8000](http://localhost:8000)

```

> ⚠️ Do **not** commit `.env` to GitHub.
> Make sure `.env` is listed in `.gitignore`.

When you want to **expose your local backend for external or production-like testing**,  
replace the `BACKEND_URL` value with your temporary **ngrok** URL.

```

BACKEND_URL=[https://xxxx-1234-56-78.ngrok-free.app](https://xxxx-1234-56-78.ngrok-free.app)

```

---

## 💻 Local Development

### 1️⃣ Install dependencies

```bash
uv sync
```

### 2️⃣ Run the backend

Option A — using Makefile (recommended):

```bash
make dev
```

Option B — manual run:

```bash
uv run uvicorn api.index:app --reload --host 0.0.0.0 --port 8000
```

### 3️⃣ Access the API

- Local: [http://localhost:8000](http://localhost:8000)
- Docs: [http://localhost:8000/docs](http://localhost:8000/docs)

---

## 🌐 Temporary Public Access (ngrok)

When you need to test the backend from a deployed frontend or share your API:

1. Start ngrok:

   ```bash
   ngrok http 8000
   ```

2. Copy the forwarding URL, e.g.

   ```
   https://f3a2-98-115-12-44.ngrok-free.app
   ```

3. Update `.env`:

   ```
   BACKEND_URL=https://f3a2-98-115-12-44.ngrok-free.app
   ```

4. Your frontend or external services can now access the backend through that URL.

> 🕓 ngrok free sessions expire after several hours.
> When restarted, you’ll get a new URL — update `.env` again if needed.

---

## 🧠 Useful Commands

| Command           | Description                             |
| ----------------- | --------------------------------------- |
| `make dev`        | Run FastAPI locally with Uvicorn        |
| `ngrok http 8000` | Expose local backend publicly via ngrok |
