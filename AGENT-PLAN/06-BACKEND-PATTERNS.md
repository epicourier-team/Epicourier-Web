# Epicourier Backend Patterns

**Document Version**: 1.0  
**Last Updated**: November 17, 2025  
**Status**: Production (Stable)

> **Scope**: This document covers the **Python FastAPI backend** for AI/ML recommendations.  
> - **Phase 1**: Goal-based meal recommendations (✅ Complete)
> - **Phase 2 v1.1-v1.2**: Nutrient Tracking & Gamification use Next.js API Routes (no Python changes)
> - **Phase 2 v1.3**: Smart Cart with AI inventory-based suggestions (📝 Planned - will extend this backend)

---

## 📋 Document Overview

This document describes backend development patterns for Epicourier, built with **FastAPI**, **Python 3.11+**, and **AI/ML libraries**. It covers API structure, AI recommendation pipeline, lazy loading, and deployment patterns.

**Purpose**:
- Understand FastAPI project structure
- Learn AI/ML integration patterns (Gemini + SentenceTransformers)
- Implement lazy loading for performance
- Handle CUDA/CPU device management
- Follow error handling best practices

---

## 🏗️ Project Structure

### Directory Organization

```
backend/
├── api/
│   ├── __init__.py
│   ├── index.py           # FastAPI main app & endpoints
│   └── recommender.py     # AI/ML recommendation engine
├── dataset/               # CSV data files
│   ├── recipes-supabase.csv
│   ├── ingredients-supabase.csv
│   ├── tags-supabase.csv
│   ├── recipe_ingredient_map-supabase.csv
│   └── recipe_tag_map-supabase.csv
├── tests/
│   ├── __init__.py
│   ├── conftest.py
│   └── test_recommender.py
├── pyproject.toml        # Python dependencies (uv managed)
├── uv.lock              # Dependency lock file
├── Dockerfile            # Container configuration
├── Makefile             # Build & run commands (uses uv)
└── vercel.json          # Vercel deployment config
```

---

## 🚀 FastAPI Application Structure

### Main Application (`api/index.py`)

**Pattern**: Single FastAPI instance with CORS middleware

```python
import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from api.recommender import create_meal_plan
from supabase import Client, create_client
from dotenv import load_dotenv

load_dotenv()

url: str = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
key: str = os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")

supabase: Client = create_client(url, key)

app = FastAPI()

# CORS configuration for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/test")
def test_endpoint():
    """Health check endpoint."""
    data = supabase.table("Recipe").select("*").limit(5).execute()
    return {"message": data.data}


class RecommendRequest(BaseModel):
    goal: str
    num_meals: int = Field(..., alias="numMeals")

    model_config = {"populate_by_name": True}


@app.post("/recommender")
def recommend_meals(req: RecommendRequest):
    """Main recommender endpoint with input validation."""
    # Validate goal
    if not req.goal or not req.goal.strip():
        raise HTTPException(status_code=400, detail="Goal cannot be empty")

    # Validate number of meals
    if req.num_meals not in [3, 5, 7]:
        raise HTTPException(
            status_code=400, 
            detail="numMeals must be one of 3, 5, or 7"
        )

    plan, expanded_goal = create_meal_plan(req.goal, n_meals=req.num_meals)
    return {"recipes": plan, "goal_expanded": expanded_goal}
```

**Key Patterns**:
1. ✅ **Environment Variables**: Use `dotenv` for configuration
2. ✅ **CORS Middleware**: Allow cross-origin requests from frontend
3. ✅ **Pydantic Models**: Type-safe request/response validation
4. ✅ **Field Aliases**: Support camelCase from frontend (`numMeals`)
5. ✅ **Input Validation**: Validate before processing
6. ✅ **HTTPException**: Return proper HTTP error codes

---

## 🤖 AI/ML Recommendation Engine

### Architecture Overview

```
User Goal (Text)
      ↓
Gemini API (Goal Expansion)
      ↓
Nutritional Requirements (Text)
      ↓
SentenceTransformer Embeddings
      ↓
Cosine Similarity Ranking
      ↓
KMeans Clustering (Diversity)
      ↓
Top N Diverse Recipes
```

---

### Lazy Loading Pattern (`@lru_cache()`)

**Purpose**: Load heavy resources only once and cache in memory

```python
from functools import lru_cache
import torch
from sentence_transformers import SentenceTransformer
from google import genai
from supabase import create_client

# Device detection
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")
print(f"Using device: {DEVICE}")


@lru_cache()
def load_supabase():
    """Cache Supabase client connection."""
    print("Connecting to Supabase ...")
    return create_client(SUPABASE_URL, SUPABASE_KEY)


@lru_cache()
def load_recipe_data():
    """Load and merge recipe data only once."""
    print("Loading recipe data from Supabase ...")
    supabase = load_supabase()

    # Fetch all tables
    ingredients = pd.DataFrame(
        supabase.table("Ingredient").select("*").execute().data
    )
    recipes = pd.DataFrame(
        supabase.table("Recipe").select("*").execute().data
    )
    recipe_ing_map = pd.DataFrame(
        supabase.table("Recipe-Ingredient_Map").select("*").execute().data
    )
    tags = pd.DataFrame(
        supabase.table("RecipeTag").select("*").execute().data
    )
    recipe_tag_map = pd.DataFrame(
        supabase.table("Recipe-Tag_Map").select("*").execute().data
    )

    # Merge tags
    recipe_tags = recipe_tag_map.merge(
        tags, left_on="tag_id", right_on="id", suffixes=("", "_tag")
    )
    recipe_tags = recipe_tags.groupby("recipe_id")["name"].apply(list).reset_index(name="tags")

    # Merge ingredients
    recipe_ing = recipe_ing_map.merge(
        ingredients, left_on="ingredient_id", right_on="id", suffixes=("", "_ing")
    )
    recipe_ing = recipe_ing.groupby("recipe_id")["name"].apply(list).reset_index(name="ingredients")

    # Combine all metadata
    recipe_data = recipes.merge(
        recipe_tags, left_on="id", right_on="recipe_id", how="left"
    )
    recipe_data = recipe_data.merge(
        recipe_ing, left_on="id", right_on="recipe_id", how="left"
    )

    # Handle missing data
    recipe_data["tags"] = recipe_data["tags"].apply(
        lambda x: x if isinstance(x, list) else []
    )
    recipe_data["ingredients"] = recipe_data["ingredients"].apply(
        lambda x: x if isinstance(x, list) else []
    )
    
    return recipe_data


@lru_cache()
def load_embedder():
    """Load SentenceTransformer model once."""
    print("Loading sentence-transformer model ...")
    return SentenceTransformer("all-MiniLM-L6-v2", device=DEVICE)


@lru_cache()
def load_gemini_client():
    """Initialize Gemini client once."""
    print("Initializing Gemini client ...")
    return genai.Client(api_key=GEMINI_KEY)
```

**Benefits**:
- ✅ **Performance**: Load expensive models only once
- ✅ **Memory Efficiency**: Reuse cached instances across requests
- ✅ **Fast Startup**: First request pays load cost, subsequent requests are instant
- ✅ **Thread-Safe**: `@lru_cache()` is thread-safe by default

---

### CUDA/CPU Device Management

**Pattern**: Auto-detect and use GPU if available

```python
import torch

# Global device configuration
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")
print(f"Using device: {DEVICE}")

# Use in SentenceTransformer
embedder = SentenceTransformer("all-MiniLM-L6-v2", device=DEVICE)

# Convert tensors to CPU for numpy operations
scores = util.cos_sim(goal_embedding, recipe_embeddings)[0].cpu().numpy()
```

**Best Practices**:
1. ✅ Always specify `device` parameter
2. ✅ Call `.cpu()` before converting to NumPy
3. ✅ Use `convert_to_tensor=True` for GPU acceleration
4. ✅ Handle both CUDA and CPU environments

---

## 🧠 Gemini API Integration

### Goal Expansion Pattern

**Purpose**: Convert user's natural language goal into nutritional requirements

```python
from google import genai

client = load_gemini_client()

def nutrition_goal(goal_text):
    """Translate user goal into target nutritional values."""
    prompt = f"""
    Your task is to translate a user's specific diet goal into precise, 
    target nutritional values for a daily meal plan.
    Just provide the nutritional values without any additional explanation.

    **GOAL:** {goal_text}

    You may include: calories_kcal, protein_g, carbs_g, sugars_g, 
    total_fats_g, cholesterol_mg, total_minerals_mg, vit_a_microg, 
    total_vit_b_mg, vit_c_mg, vit_d_microg, vit_e_mg, vit_k_microg
    """
    
    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt
    )
    return response.text.strip()


def expand_goal(goal_text):
    """Get detailed nutritional explanation."""
    prompt = f"""
    Your task is to translate a user's specific diet goal into precise, 
    target nutritional values for a daily meal plan.

    **GOAL:** {goal_text}

    You may include: calories_kcal, protein_g, carbs_g, sugars_g, 
    total_fats_g, cholesterol_mg, total_minerals_mg, vit_a_microg, 
    total_vit_b_mg, vit_c_mg, vit_d_microg, vit_e_mg, vit_k_microg
    """

    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt
    )
    return response.text.strip()
```

**Key Points**:
- ✅ Use `gemini-2.5-flash` for fast responses
- ✅ Structured prompts with clear instructions
- ✅ Return `.text.strip()` for clean output
- ✅ Two functions: one for embedding, one for display

---

## 🎯 SentenceTransformers Pattern

### Recipe Embedding & Similarity

```python
from sentence_transformers import SentenceTransformer, util
import torch

def make_recipe_text(row):
    """Combine recipe metadata into searchable text."""
    return (
        f"{row.get('description', '')}. "
        f"Ingredients: {', '.join(row['ingredients'])}. "
        f"Tags: {', '.join(row['tags'])}."
    )


def get_recipe_embeddings(recipe_data):
    """Compute embeddings for all recipes (cached)."""
    embedder = load_embedder()
    
    if "recipe_text" not in recipe_data.columns:
        recipe_data["recipe_text"] = recipe_data.apply(
            make_recipe_text, axis=1
        )
    
    print("Computing recipe embeddings ...")
    embeddings = embedder.encode(
        recipe_data["recipe_text"].tolist(),
        convert_to_tensor=True  # GPU acceleration
    )
    return embeddings


def rank_recipes_by_goal(goal_text, top_k=20):
    """Rank recipes by semantic similarity to goal."""
    recipe_data = load_recipe_data()
    recipe_embeddings = get_recipe_embeddings(recipe_data)
    embedder = load_embedder()

    # Get nutritional goal from Gemini
    nutri_goal = nutrition_goal(goal_text)
    
    # Embed goal
    goal_embedding = embedder.encode(
        nutri_goal, 
        convert_to_tensor=True
    )
    
    # Compute cosine similarity
    scores = util.cos_sim(
        goal_embedding, 
        recipe_embeddings
    )[0].cpu().numpy()

    # Rank by similarity
    recipe_data = recipe_data.copy()
    recipe_data["similarity"] = scores
    ranked = recipe_data.sort_values(
        by="similarity", 
        ascending=False
    ).head(top_k)
    
    return ranked, nutri_goal
```

**Model Details**:
- **Model**: `all-MiniLM-L6-v2`
- **Embedding Size**: 384 dimensions
- **Speed**: ~14,000 sentences/sec on GPU
- **Use Case**: Semantic search, similarity ranking

---

## 🎲 Diversity Selection (KMeans)

**Purpose**: Ensure recommended recipes are diverse, not similar

```python
from sklearn.cluster import KMeans

def select_diverse_recipes(ranked_df, n_meals=3):
    """Cluster embeddings to ensure diversity among top recipes."""
    embedder = load_embedder()
    n_clusters = min(n_meals, len(ranked_df))
    
    if len(ranked_df) <= n_meals:
        return ranked_df

    # Embed top recipes
    sub_embeds = embedder.encode(ranked_df["recipe_text"].tolist())
    
    # Cluster into N groups
    kmeans = KMeans(
        n_clusters=n_clusters, 
        random_state=42, 
        n_init="auto"
    )
    cluster_labels = kmeans.fit_predict(sub_embeds)

    # Select top recipe from each cluster
    selected_indices = []
    for c in range(n_clusters):
        cluster_recipes = ranked_df[cluster_labels == c]
        top_one = cluster_recipes.sort_values(
            "similarity", 
            ascending=False
        ).head(1)
        selected_indices.append(top_one.index[0])
    
    return ranked_df.loc[selected_indices].sort_values(
        "similarity", 
        ascending=False
    )
```

**Algorithm**:
1. Take top 20 similar recipes
2. Cluster them into N groups (3, 5, or 7)
3. Select best recipe from each cluster
4. Return diverse set

---

## 🔄 Complete Recommendation Pipeline

```python
def create_meal_plan(goal_text, n_meals=3):
    """
    Main recommendation function.
    
    Args:
        goal_text: User's dietary goal (e.g., "lose weight")
        n_meals: Number of recipes to recommend (3, 5, or 7)
    
    Returns:
        meal_plan: List of recommended recipes with metadata
        exp_goal: Expanded goal explanation
    """
    # Step 1: Rank by similarity to goal
    ranked, nutri_goal = rank_recipes_by_goal(goal_text)
    
    # Step 2: Select diverse subset
    diverse = select_diverse_recipes(ranked, n_meals)
    
    # Step 3: Get human-readable goal expansion
    exp_goal = expand_goal(goal_text)

    # Step 4: Format response
    meal_plan = []
    for i, row in enumerate(diverse.itertuples(), 1):
        meal_plan.append({
            "meal_number": i,
            "name": row.name,
            "tags": row.tags,
            "key_ingredients": row.ingredients[:10],
            "reason": f"Selected because it aligns with goal '{goal_text}' and differs from other meals.",
            "similarity_score": round(float(row.similarity), 3),
            "recipe": row.recipe_text
        })

    return meal_plan, exp_goal
```

**Pipeline Flow**:
```
User Goal → Gemini (expand) → Embeddings → Similarity → Ranking → Clustering → Diversity → Response
```

---

## 📦 Dependency Management

### `pyproject.toml` (uv managed)

```toml
[project]
name = "epicourier-backend"
version = "0.1.0"
requires-python = ">=3.9"
dependencies = [
    "fastapi>=0.115.14",
    "google-genai>=1.47.0",
    "pandas>=2.3.3",
    "pydantic>=2.11.7",
    "python-dotenv>=1.1.1",
    "scikit-learn>=1.6.1",
    "sentence-transformers>=5.1.2",
    "supabase>=2.16.1",
    "torch>=2.8.0",
    "uvicorn>=0.35.0",
]
```

**Installation** (using uv):
```bash
uv sync                    # Install all dependencies
uv add <package>          # Add new dependency
uv run uvicorn api.index:app --reload  # Run server
```

**Note**: For CUDA support, uv will automatically detect and install appropriate PyTorch version.

---

## 🚨 Error Handling Patterns

### Input Validation

```python
from fastapi import HTTPException

@app.post("/recommender")
def recommend_meals(req: RecommendRequest):
    # Validate goal
    if not req.goal or not req.goal.strip():
        raise HTTPException(
            status_code=400, 
            detail="Goal cannot be empty"
        )

    # Validate number of meals
    if req.num_meals not in [3, 5, 7]:
        raise HTTPException(
            status_code=400, 
            detail="numMeals must be one of 3, 5, or 7"
        )

    try:
        plan, expanded_goal = create_meal_plan(
            req.goal, 
            n_meals=req.num_meals
        )
        return {"recipes": plan, "goal_expanded": expanded_goal}
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Recommendation failed: {str(e)}"
        )
```

**Best Practices**:
1. ✅ Validate inputs before processing
2. ✅ Use appropriate HTTP status codes
3. ✅ Return descriptive error messages
4. ✅ Catch unexpected exceptions

---

## 🐳 Deployment Patterns

### Dockerfile (uv-based)

```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install uv for package management
RUN pip install uv

# Copy dependency files
COPY pyproject.toml uv.lock ./
RUN uv sync --frozen

# Copy application code
COPY . .

EXPOSE 8000

CMD ["uv", "run", "uvicorn", "api.index:app", "--host", "0.0.0.0", "--port", "8000"]
```

> **Note**: The current Dockerfile may still use requirements.txt for legacy compatibility.
> Migration to uv-based builds is recommended for consistency with local development.

---

### Vercel Configuration (`vercel.json`)

```json
{
  "builds": [
    {
      "src": "backend/api/index.py",
      "use": "@vercel/python"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "backend/api/index.py"
    }
  ]
}
```

---

### Makefile

```makefile
.PHONY: dev render test clean

dev:
	uv run uvicorn api.index:app --reload --host 0.0.0.0 --port 8000

render:
	uv run uvicorn api.index:app --host 0.0.0.0 --port ${PORT}

test:
	uv run pytest tests/ -v

clean:
	find . -type d -name "__pycache__" -exec rm -rf {} +
	find . -type f -name "*.pyc" -delete
```

**Usage**:
```bash
uv sync        # Install dependencies
make dev       # Start development server
make test      # Run tests
make clean     # Clean cache files
```

---

## 🧪 Testing Patterns

### Pytest Configuration

```python
# tests/conftest.py
import pytest
from api.index import app
from fastapi.testclient import TestClient

@pytest.fixture
def client():
    return TestClient(app)


# tests/test_recommender.py
def test_recommend_meals(client):
    response = client.post(
        "/recommender",
        json={"goal": "lose weight", "numMeals": 3}
    )
    assert response.status_code == 200
    data = response.json()
    assert "recipes" in data
    assert "goal_expanded" in data
    assert len(data["recipes"]) == 3


def test_invalid_num_meals(client):
    response = client.post(
        "/recommender",
        json={"goal": "build muscle", "numMeals": 10}
    )
    assert response.status_code == 400


def test_empty_goal(client):
    response = client.post(
        "/recommender",
        json={"goal": "", "numMeals": 3}
    )
    assert response.status_code == 400
```

**Run Tests**:
```bash
pytest tests/ -v
```

---

## 🔧 Environment Variables

### `.env` File

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...

# Gemini API
GEMINI_KEY=AIzaSyXXX...
```

**Loading**:
```python
from dotenv import load_dotenv
import os

load_dotenv()

SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")
GEMINI_KEY = os.getenv("GEMINI_KEY")
```

---

## 🚀 Performance Optimization

### 1. Lazy Loading with `@lru_cache()`

- Load models once, cache in memory
- Reuse across requests
- Thread-safe by default

### 2. GPU Acceleration

```python
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")
embedder = SentenceTransformer("all-MiniLM-L6-v2", device=DEVICE)
```

### 3. Batch Processing

```python
# Process all recipes at once
embeddings = embedder.encode(
    recipe_data["recipe_text"].tolist(),
    convert_to_tensor=True,
    batch_size=32  # Adjust based on GPU memory
)
```

### 4. Data Preloading

- Load recipe data on startup
- Cache embeddings in memory
- Avoid repeated database queries

---

## 📊 Monitoring & Logging

### Logging Pattern

```python
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@app.post("/recommender")
def recommend_meals(req: RecommendRequest):
    logger.info(f"Received recommendation request: goal='{req.goal}', n_meals={req.num_meals}")
    
    try:
        plan, expanded_goal = create_meal_plan(req.goal, n_meals=req.num_meals)
        logger.info(f"Successfully generated {len(plan)} recommendations")
        return {"recipes": plan, "goal_expanded": expanded_goal}
    except Exception as e:
        logger.error(f"Recommendation failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
```

---

## 📚 Related Documentation

| Document                                      | Purpose                        |
|-----------------------------------------------|--------------------------------|
| [01-TECH-STACK.md](./01-TECH-STACK.md)       | Technology stack overview      |
| [02-ARCHITECTURE.md](./02-ARCHITECTURE.md)   | System architecture            |
| [03-API-SPECIFICATIONS.md](./03-API-SPECIFICATIONS.md) | API endpoints |
| [04-DATABASE-DESIGN.md](./04-DATABASE-DESIGN.md) | Database schema |
| [07-TESTING-STRATEGY.md](./07-TESTING-STRATEGY.md) | Backend testing patterns |

---

## 🔄 Document Updates

This document should be updated when:
- ✅ New endpoints are added
- ✅ AI/ML models are upgraded
- ✅ Lazy loading patterns change
- ✅ Performance optimizations are implemented

**Last Review**: November 17, 2025  
**Next Review**: December 1, 2025
