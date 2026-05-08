# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Install all dependencies (root workspace)
npm install

# Development (runs server on :3071 and client dev server on :3070 with proxy)
npm run dev

# Build everything (client then server)
npm run build

# Run server tests
npm test

# Run a single test file
npm run test -w server -- --reporter=verbose src/app.test.ts

# Type-check client only (no emit)
cd client && npx tsc --noEmit

# Build server only
npm run build -w server

# Build client only
npm run build -w client
```

## Architecture

Boxy is a self-hosted game-collection manager. It is a monorepo with two npm workspaces:

- **`server/`** — Node.js/Express API (TypeScript, compiled to `server/dist/`)
- **`client/`** — React SPA (TypeScript, Vite, Tailwind CSS v4, compiled to `client/dist/`)

In production (Docker), the server serves the compiled client from `client/dist/` as static files, so the whole app runs as a single process on one port.

In development, Vite's dev server runs on `:3070` and proxies all `/api/*` requests to the Express server on `:3071`.

### Server layers

```
server/src/
  index.ts          entry point — starts the HTTP server
  app.ts            createApp() — Express setup, middleware, static serving in prod
  config.ts         reads PORT and DATA_DIR from env
  routes/games.ts   all API routes including image proxy/search
  services/games.ts all data access — reads/writes games.json and images/
```

All state lives in flat files under `DATA_DIR` (default: `../../data` relative to compiled output, i.e. the repo-root `data/` when running locally):
- `data/games.json` — array of Game objects, newest first
- `data/images/` — uploaded/proxied images stored as `<uuid>.<ext>`

### Client layers

```
client/src/
  App.tsx               routing (react-router-dom)
  types.ts              shared Game interface and condition constants
  lib/db.ts             thin fetch wrappers for every API call
  lib/styles.ts         shared inline-style constants
  contexts/
    ThemeContext.tsx     theme state + localStorage persistence; 10 built-in themes
    ToastContext.tsx     toast notification system
  pages/
    FrontPage.tsx        main collection/wishlist view
    SettingsPage.tsx     theme picker, card size, export/import/delete-all
    DonatePage.tsx       donation links
  components/           UI components (GameCard, GameForm, SearchFilters, BulkOperations, …)
  hooks/useCardSize.ts  card size preference via localStorage
```

Styling is done with Tailwind utility classes plus inline styles driven by the active `ThemeDefinition` object from `ThemeContext`. There is no global CSS theme; every themed color is applied inline via `theme.*` properties.

### Image handling

The server has three image ingestion paths:
1. `POST /api/images` — raw upload (browser `file.arrayBuffer()`)
2. `GET /api/proxy-and-save?url=` — server-side fetch of an external URL (SSRF-guarded by DNS lookup against private ranges)
3. Box-art search via `GET /api/search-images?q=` — scrapes DuckDuckGo Images, returns thumbnail/full URLs; client then calls proxy-and-save on the chosen result

### Data model

```ts
interface Game {
  id: string          // UUID
  title: string
  condition: string   // Sealed | Excellent | Good | Fair | Poor
  image_url?: string  // /api/images/<filename> or empty
  notes?: string
  is_wishlist: boolean
  created_at: string  // ISO-8601
  updated_at: string
}
```

Import/export (Settings page) round-trips the full collection as JSON, embedding images as base64 data URIs so backups are self-contained.
