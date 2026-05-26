# HoseJ Mobile

React Native (Expo) client for [HoseJ](https://github.com/justingebert/hosej) — the friend-group social hub
(daily questions, rallies, jukebox, chats). It talks to the **existing hosej webapp API**;
the backend is reused as-is, not rebuilt. This app is a new client on top of it.

## Stack

- **Expo SDK 55** + **expo-router** (file-based routing, typed routes)
- **Uniwind** + **Tailwind v4** — styling via `className`
- **TanStack Query** — server state / caching
- Plain `fetch` wrapper for the API (`src/lib/api/client.ts`)

## Running it in dev

Two processes, two terminals:

**1. The API** — from here, targeting the real HoseJ webapp repo:

```bash
npm run dev:api    # serves the API + web on http://localhost:3000
```

**2. This app** — here:

```bash
npm install
npm run ios        # or: npm run android / npm run web
```

### How the app finds the API

`src/lib/config.ts` resolves `API_URL` automatically:

- It reuses the **Expo dev server host** and swaps to port **3000**, so it works on the
  iOS simulator *and* on a physical device on the same Wi-Fi — no manual IP needed.
- Override with `EXPO_PUBLIC_API_URL` (required for prod / a deployed API). Copy
  `.env.example` → `.env.local` and uncomment.

The home screen shows the resolved `API_URL` and a live connectivity check against the
public `/api/auth/session` endpoint — green ✓ means the chain works end to end.

## Auth (current state)

Auth is **stubbed for dev** (Phase 0). The webapp uses NextAuth cookie+CSRF, which is
awkward from native. The plan (Phase 5) is to add a small **additive** bearer-token
endpoint to the webapp (`deviceId → JWT`; API also accepts `Authorization: Bearer`).
Until then, protected endpoints return 401 — only public routes work.

Set `EXPO_PUBLIC_DEV_TOKEN` to attach a stub `Authorization: Bearer` header now.

## Layout

```
src/
  app/            # expo-router screens (file = route)
  lib/
    config.ts     # API_URL resolution
    query.ts      # TanStack Query client
    api/client.ts # apiFetch() + ApiError
  types/          # DTOs copied from the webapp (see types/README.md)
  global.css      # Tailwind entry + platform font vars
```