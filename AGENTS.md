---
name: "StoryNest Full-Stack Development Guide"
description: "Practical guidelines for enhancing the StoryNest TypeScript backend and Expo mobile app"
category: "Project Contribution"
author: "StoryNest Maintainers"
authorUrl: "https://github.com/gakeez/agents_md_collection"
tags:
  [
    "typescript",
    "express",
    "sqlite",
    "expo",
    "react-native",
    "react-native-paper",
    "zustand",
    "full-stack"
  ]
lastUpdated: "2025-06-16"
---

# StoryNest Development Guide

## Project Overview

StoryNest pairs a TypeScript/Express API backed by SQLite with an Expo-managed React Native client. Together they let storytellers craft 200-word AI-generated tales, continue existing narratives, and manage a personal library with upgrade and sharing flows. This guide documents the conventions, tooling, and workflows currently used in the repository so contributors can extend the experience without regressing quality.

## Repository Structure

```
.
├── backend/              # Express server, SQLite access layer, OpenAI + Stripe integrations
│   ├── src/
│   │   ├── config/       # Environment resolution
│   │   ├── db/           # SQLite schema + repositories (better-sqlite3)
│   │   ├── middleware/   # JWT auth helpers
│   │   ├── routes/       # Express routers (auth, stories, billing)
│   │   └── services/     # Business logic (story generation, billing, auth)
├── mobile/               # Expo React Native app
│   ├── src/
│   │   ├── components/   # Shared UI (AppScaffold, PromptComposer, StoryCard, etc.)
│   │   ├── navigation/   # Stack navigator with Paper theming
│   │   ├── screens/      # Auth, Home, Library, Continuation, Upgrade
│   │   ├── services/     # API clients via axios
│   │   ├── store/        # Zustand stores (auth, theme, stories)
│   │   ├── theme/        # React Native Paper MD3 palette helpers
│   │   └── types/        # Shared DTOs
└── README.md             # High-level product and setup docs
```

## Tech Stack Snapshot

- **Backend**: Node.js 20+, Express 4, TypeScript 5, better-sqlite3 for persistence, Zod validation, JWT auth, OpenAI SDK, Stripe SDK.
- **Mobile**: Expo SDK 54, React Native 0.74, React Native Paper (MD3), React Navigation 6, Zustand state stores, Axios networking, React Native Testing Library via Node test runner build artifacts.
- **Tooling**: ESM modules throughout, ESLint (typescript-eslint) in both packages, tsx for backend dev, Expo CLI for mobile, node --test for mobile unit tests.

## Environment & Tooling Setup

### Global prerequisites

- Node.js **20.x** (keep parity with backend and mobile engines)
- npm **10.x**
- Expo CLI (`npm install -g expo`) for mobile development
- iOS Simulator / Android Emulator / Expo Go for runtime testing

### Backend bootstrap

```bash
cd backend
cp .env.example .env   # configure secrets like JWT_SECRET, OPENAI_API_KEY, STRIPE_SECRET_KEY
npm install
npm run dev            # launches tsx watcher on src/server.ts
```

Key scripts:

| Command | Notes |
| ------- | ----- |
| `npm run dev` | Start Express server with live reload (`tsx`). |
| `npm run build` | Emit compiled JS in `dist/`. Run before production deploys. |
| `npm run start` | Run compiled server. Requires `npm run build` first. |
| `npm run lint` | ESLint across `src/**/*.ts`. |

SQLite (`storynest.db`) is created on demand. Repositories live under `src/db/repositories/`—add new tables and CRUD helpers there, exporting typed accessors.

### Mobile bootstrap

```bash
cd mobile
npm install
npm run start        # Expo dev server
```

Important scripts:

| Command | Notes |
| ------- | ----- |
| `npm run start` | Expo bundler (Metro) for native + web. |
| `npm run android` / `npm run ios` | EAS build pipeline via Expo Run commands. |
| `npm run lint` | eslint with `eslint-config-universe`. |
| `npm run test` | Two-step pipeline: transpile tests with `tsc --project tsconfig.test.json` then execute via `node --test`. |

Configure the backend origin in `mobile/app.json` (`expo.extra.apiUrl`). For local testing ensure backend is accessible from device/emulator network.

## Coding Principles

### Backend (Express + SQLite)

- **ESM with explicit extensions**: Import using `./path/file.js` to align with `type: module`.
- **Service-first architecture**: Keep request parsing in routers (`src/routes`), delegate logic to services (`src/services`) that orchestrate repositories and external SDKs.
- **SQLite access**: Centralise raw SQL in repository modules. Prefer small helpers returning typed objects rather than leaking database rows directly.
- **Validation**: Use Zod schemas in services or route handlers before performing operations that mutate state or call external APIs.
- **Auth flow**: JWT utilities live in `src/middleware/authenticate.ts`. When adding routes requiring auth, reuse `authenticate` to populate `req.user`.
- **Error handling**: Throw `Error` instances from services and rely on `asyncHandler` wrapper / Express error middleware to format responses.
- **Testing**: If adding backend tests, follow Node’s built-in test runner or integrate a lightweight harness; ensure DB setup/teardown is isolated.

### Mobile (Expo + React Native Paper)

- **Theming**: Use the persisted Zustand theme store (`src/store/themeStore.ts`) and `createPaperTheme` to access brand colours. Components rendered inside `AppScaffold` automatically pick up the theme and sidebar toggle—prefer this wrapper for new screens.
- **Navigation**: Register screens in `AppNavigator` and keep `headerShown: false`. Use typed params via `RootStackParamList` when adding routes.
- **State management**: `src/store` contains Zustand stores for auth, stories, and theme. Use selectors to avoid unnecessary re-renders. For async actions, expose `initialise`/`hydrate` style effects that components call inside `useEffect`.
- **Networking**: `src/services/api.ts` centralises axios configuration (auth headers, base URL). Reuse helpers rather than invoking `fetch` directly.
- **UI composition**: Build new UI with React Native Paper MD3 components to stay consistent. Favour `Surface`, `Card`, and `List` for structural elements and keep spacing consistent with existing `StyleSheet` tokens (24px radii, 16/20 padding).
- **Testing**: When creating component tests, add `.test.tsx` files under `mobile/tests`. Tests must compile via `tsconfig.test.json` (no Expo/React Native aliases), so avoid platform-specific modules or mock them explicitly.
- **Icons**: Use names available in `@expo/vector-icons/MaterialCommunityIcons`. Validate icon names to avoid runtime warnings (e.g., `weather-night`, `white-balance-sunny`).

## Feature Workflows

1. **Authentication**: `AuthScreen` handles email/password login and registration, using `authStore` to persist tokens via `expo-secure-store`. When adjusting flows, update both store actions and axios interceptors.
2. **Story generation**: `storyService.generateStory` enforces daily quotas via `usageRepository`. Mobile `PromptComposer` triggers `/stories/generate` and refreshes the home feed. Maintain the contract `{ story, remaining }` for UI messaging.
3. **Continuation**: `/stories/:id/share` returns or creates a share ID; the continuation screen expects a `Story` object, so keep backend responses aligned with `mobile/src/types/story.ts`.
4. **Billing**: `billingService` stubs Stripe interactions when `STRIPE_SECRET_KEY` is absent. Mobile `UpgradeScreen` calls `/billing/checkout` and offers a mock premium activation route—ensure new billing features check for premium status via `user.is_premium` and `premium_expires_at`.

## Performance & UX Considerations

- Use memoization hooks (`useMemo`, `useCallback`) when passing callbacks into deeply nested Paper components to avoid unnecessary renders, especially inside `FlatList` delegates like `StoryCard`.
- On backend story generation, `callOpenAI` already falls back to a deterministic tale when offline—preserve this behaviour for deterministic tests.
- When adding new modals or overlays, integrate them into `AppScaffold`’s Portal layer to keep the blur/gradient background consistent.
- Keep the light/dark palettes cohesive: update `createPaperTheme.ts` for global changes rather than hardcoding colours within components.

## Accessibility & Internationalization

- Text components should use Paper typography variants (`titleLarge`, `bodyMedium`, etc.) so dynamic type scales correctly.
- Provide `accessibilityLabel` or `aria` equivalents for interactive components (e.g., theme toggle, menu icons).
- The app currently ships in English only; prepare strings via centralized constants/modules to facilitate future localization.

## Pull Request Expectations

- Follow the testing commands relevant to touched packages (`npm run lint`, `npm run test`, etc.). Document any environment-related failures in the PR description.
- Keep commits scoped (backend vs mobile) and reference affected screens/services in messages.
- Update README sections if you add new environment variables, scripts, or cross-platform behaviours.
- Avoid bundling large image assets; document any suggested imagery in README for later inclusion.

Adhering to these conventions ensures StoryNest evolves into the polished, theme-aware storytelling companion envisioned by the product team.
