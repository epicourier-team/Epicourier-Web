# Contributing Guide

Thank you for your interest in contributing to **Epicourier-Web**!
This document provides a quick overview of how to contribute.
For the complete workflow, please read our detailed
[Git Branching, Merging, and Release Convention](https://github.com/epicourier-team/Epicourier-Web/wiki/Git-Branching,-Merging,-and-Release-Convention).

## 1. Getting Started

1. **Fork** the repository on GitHub.
2. **Clone** your fork:

   ```bash
   git clone https://github.com/<your-username>/Epicourier-Web.git
   cd Epicourier-Web
   ```

3. Set the upstream remote:

   ```bash
   git remote add upstream https://github.com/epicourier-team/Epicourier-Web.git
   ```

## 2. Branch Naming

Follow our naming convention:

```
<issue-number>-<type>/<short-description>
```

For large, multi-domain features:

```
<issue-number>-<type>/<short-description>/<domain>
```

Examples:

- `123-feature/add-login-api`
- `123-feature/add-login-api/backend`
- `145-hotfix/fix-token-expiration`

For a full explanation, see the
[Branching Convention Wiki](https://github.com/epicourier-team/Epicourier-Web/wiki/Git-Branching,-Merging,-and-Release-Convention).

## 3. Making Changes

1. Create a new branch from `main`:

   ```bash
   git checkout main
   git pull
   git checkout -b 123-feature/add-login-api
   ```

2. Make your changes and commit with a
   [Conventional Commit message](./commit-style-guide.md):

   ```
   feat: add login API for user authentication
   ```

3. Run tests before submitting:

   ```bash
   npm run test
   ```

## 4. Submitting a Pull Request

1. Push your branch to your fork:

   ```bash
   git push origin 123-feature/add-login-api
   ```

2. Open a **Pull Request** to the corresponding branch:

   - Typically → `main`
   - For multi-domain work → parent feature branch (e.g., `123-feature/add-login-api`)

3. Include in the PR:

   - A short **summary** of the change
   - `Fixes #<issue-number>` in the description
   - **How you tested** the change (commands, screenshots, logs)
   - Any specific notes for reviewers

4. Request **at least two reviewers**.
5. Merge only through **GitHub UI → “Create a merge commit”**
   (no squash/rebase).

## 5. Main Branch Rules

- No direct commits or pushes
- No local merges into `main`
- 2 reviewer approvals required
- CI checks must pass before merging

These rules are enforced via **Branch Protection Settings**.

## 6. Run and Test Locally

```bash
npm install
npm run dev
npm run test
```

## 7. Local Supabase Development

We use a local Supabase instance for development and testing.

> [!NOTE]
> We use `npx supabase@beta` because the stable version has known issues with Docker on some environments.

### Setup & Run

1. **Start Supabase**:

   ```bash
   npx supabase@beta start
   ```

   This will spin up the local database, auth, and other services.

2. **Stop Supabase**:

   ```bash
   npx supabase@beta stop
   ```

3. **Reset Database** (Apply migrations & seed data):
   ```bash
   npx supabase@beta db reset
   ```

### Migrations

- **Create a migration**:
  ```bash
  npx supabase@beta db diff -f <migration_name>
  ```
- **Apply migrations**:
  Automatically applied when running `start` or `db reset`.
