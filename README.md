# StoryNest

StoryNest is a mobile-first storytelling experience where users craft short, vivid, AI-generated tales from simple prompts. The project includes a TypeScript/Express backend with SQLite persistence and an Expo-based React Native application.

## Features

- ⚡️ **200-word AI stories** generated from a single user prompt
- 🔁 **Story continuation** to build ongoing arcs
- 📚 **Personal library** of saved stories with quick sharing links
- 🎯 **Daily limits** (3 stories for free tier) and **premium unlocks** for unlimited creation
- 💸 **Stripe-powered checkout** integration scaffold with a mock upgrade flow for local testing
- 🔒 Email/password authentication with JWT sessions
- 📊 Ready for usage analytics & admin tooling extensions

## Repository structure

```
.
├── backend   # Express API, SQLite persistence, Gemini + Stripe integrations
├── mobile    # Expo React Native app for iOS, Android, and web
└── README.md
```

---

## Backend

### Prerequisites

- Node.js 20+
- npm 10+

### Environment variables

Copy `.env.example` and update credentials as needed:

```
cd backend
cp .env.example .env
```

| Variable | Description |
| --- | --- |
| `PORT` | API port (default `4000`) |
| `JWT_SECRET` | Secret for signing JWT access tokens |
| `GEMINI_API_KEY` | Google Gemini API key (optional – falls back to offline stub) |
| `STRIPE_SECRET_KEY` | Stripe secret key for checkout sessions (optional) |
| `APP_URL` | Base URL used when composing share links & Stripe redirects |
| `DATABASE_FILE` | SQLite database path |
| `FREE_STORY_DAILY_LIMIT` | Daily quota for free-tier users |

### Key scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the API in watch mode (tsx) |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm run start` | Run the compiled server |
| `npm run lint` | Lint backend sources |

### API overview

| Method & path | Description |
| --- | --- |
| `POST /auth/register` | Create a new account (email/password) |
| `POST /auth/login` | Authenticate & receive JWT |
| `GET /auth/me` | Fetch current profile |
| `POST /stories/generate` | Generate a new (or continued) story using Gemini |
| `GET /stories` | List saved stories for the user |
| `POST /stories/:id/share` | Create or retrieve a public share link |
| `GET /stories/shared/:shareId` | Fetch shared story by token |
| `POST /billing/checkout` | Create Stripe checkout (returns URL; mocked when Stripe key missing) |
| `POST /billing/webhook/mock-upgrade` | Mark the user as premium (local testing helper) |

The backend enforces free-tier limits, stores stories, and persists story usage counts. When `GEMINI_API_KEY` is absent, a deterministic placeholder story keeps the workflow testable offline.

---

## Mobile app

### Prerequisites

- Node.js 20+
- Expo CLI (`npm install -g expo`)
- iOS/Android emulator or Expo Go on device

### Setup

```
cd mobile
npm install
expo start
```

#### API URL Configuration

The mobile app needs to connect to the backend API. The URL is configured in `mobile/app.json` under `expo.extra.apiUrl`.

**Current default:** `http://10.0.0.1:4000`

Adjust based on your environment:

- **Android Emulator (local dev):** `http://10.0.0.1:4000` (host machine's localhost)
- **Physical Device (local dev):** `http://YOUR_COMPUTER_IP:4000` (e.g., `http://192.168.1.100:4000`)
  - Find your IP: Run `ipconfig` (Windows) or `ifconfig` (Mac/Linux)
- **Production Build:** Update to your deployed backend URL (e.g., `https://api.storynest.com`)

**⚠️ IMPORTANT:** Remember to update `mobile/app.json` before building for production!

Also update the fallback URL in `mobile/src/services/api.ts` (line 7) to match your production URL.

### Highlights

- **Authentication** flows backed by the API using JWT tokens stored in secure async storage
- **Prompt composer** with tone & genre selectors and quota messaging
- **Home feed** showing the latest creation with quick access to the library
- **Continuation workspace** to extend stories while respecting quota limits
- **Upgrade screen** that launches Stripe checkout (or a mock activation) for premium tier
- **Sharing** support via generated URLs

The UI is built with React Native Paper components for rapid, accessible styling and uses Zustand for state management.

---

## Development tips

- SQLite database (`storynest.db`) is created automatically on first run inside the backend folder.
- To simulate premium access without Stripe, call `POST /billing/webhook/mock-upgrade` from the mobile app’s upgrade screen.
- The AI provider is abstracted so you can plug in different models or providers (e.g., Gemini) as desired.
- Extendable architecture: add admin dashboards or analytics by introducing new routes and stores without rewriting core flows.

---

## License

MIT
