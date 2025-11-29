# Installation Guide

## Requirements

* Node.js **v20.0.0** or higher

## Clone the Repository

```bash
git clone https://github.com/epicourier-team/Epicourier-Web.git
```

If you plan to contribute, please **fork the repository first**,
then add your fork as the `origin` remote.

For more details, see **[CONTRIBUTE.md](./CONTRIBUTE.md)**.

---

## Install Dependencies

```bash
cd web
npm install
```

---

## Environment Variables

Copy the example environment file and configure your variables:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your values:

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anonymous key | Yes |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | VAPID public key for push notifications | For push notifications |
| `VAPID_PRIVATE_KEY` | VAPID private key for push notifications | For push notifications |
| `VAPID_SUBJECT` | Contact email for push notifications | For push notifications |

### Generate VAPID Keys (Optional - for Push Notifications)

```bash
npx web-push generate-vapid-keys
```

Copy the generated keys to your `.env.local` file.

---

## Start Development Server

```bash
npm run dev
```

---

## Run Tests (Jest)

```bash
npm run test
```

