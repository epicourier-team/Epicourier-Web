# Contributing Guide

Thank you for your interest in contributing to **Epicourier-v2**! This document provides the complete workflow for contributing to our project.

## 1. Getting Started

1.  **Fork** the repository on GitHub.
2.  **Clone** your fork:

    ```bash
    git clone https://github.com/<your-username>/Epicourier-v2.git
    cd Epicourier-v2
    ```

3.  Set the upstream remote to track the original repository:

    ```bash
    git remote add upstream https://github.com/pranshavpatel/Epicourier-v2.git
    ```

## 2. Project Structure

-   **`backend/`**: FastAPi backend (Python).
-   **`web/`**: Next.js frontend (TypeScript/React).
-   **`data/`**: Data files and scripts.

## 3. Development Workflow

### Branch Naming Convention

We follow a strict naming convention for branches to keep our history clean and organized.

**Format:**
```
<issue-number>-<type>/<short-description>
```

**Types:**
-   `feature`: New features or significant improvements.
-   `bugfix`: Fixes for bugs or issues.
-   `hotfix`: Critical fixes for production issues.
-   `refactor`: Code restructuring without structural changes.
-   `docs`: Documentation updates.
-   `test`: Adding or modifying tests.

**Examples:**
-   `123-feature/add-login-api`
-   `145-bugfix/fix-token-expiration`
-   `201-docs/update-readme`

### Making Changes

1.  **Sync with Upstream**: Always start with a fresh state.
    ```bash
    git checkout main
    git pull upstream main
    ```

2.  **Create a Branch**:
    ```bash
    git checkout -b 123-feature/add-smart-shopping-list
    ```

3.  **Make Changes**: Write clean, maintainable code.

4.  **Run Tests**: Ensure you haven't broken anything.
    ```bash
    # Backend
    cd backend
    pytest

    # Frontend
    cd web
    npm run test
    ```

### Commit Messages

We follow the **Conventional Commits** specification.

**Format:**
```
<type>(<scope>): <subject>
```

**Types:**
-   `feat`: A new feature
-   `fix`: A bug fix
-   `docs`: Documentation only changes
-   `style`: Changes that do not affect the meaning of the code (white-space, formatting, etc)
-   `refactor`: A code change that neither fixes a bug nor adds a feature
-   `perf`: A code change that improves performance
-   `test`: Adding missing tests or correcting existing tests
-   `chore`: Changes to the build process or auxiliary tools

**Example:**
```
feat(auth): implement jwt token generation
fix(pantry): resolve crash on item deletion
```

## 4. Submitting a Pull Request (PR)

1.  **Push** your branch to your fork:
    ```bash
    git push origin 123-feature/add-smart-shopping-list
    ```

2.  Open a **Pull Request** on GitHub:
    -   Target the `main` branch.
    -   Title: Clear and descriptive (e.g., "Add Smart Shopping List Feature").

3.  **PR Description Template**:
    -   **Summary**: What does this PR do?
    -   **Fixes**: `Fixes #<issue-number>` (links the PR to the issue).
    -   **Testing**: How did you verify the changes? (Screenshots, logs, etc.)

4.  **Review Process**:
    -   Request at least **two reviewers**.
    -   Address comments and make necessary changes.
    -   Once approved, merge via **"Create a merge commit"** (do not squash or rebase unless requested).

## 5. Main Branch Rules

-   **Protected**: No direct commits to `main` are allowed.
-   **Reviews**: All PRs require at least 2 approvals.
-   **CI/CD**: All automated checks (tests, linting) must pass.

## 6. Setup for Development

### Backend (Python)
```bash
cd backend
python -m venv venv
# Windows
.\venv\Scripts\activate
# Mac/Linux
source venv/bin/activate

pip install -r requirements.txt
uvicorn api.index:app --reload --port 8000
```

### Frontend (Next.js)
```bash
cd web
npm install
npm run dev
```

---
Happy Coding! 🚀
