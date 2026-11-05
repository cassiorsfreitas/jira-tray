# jira-tray

macOS tray app to centralize Jira tickets assigned to you across all boards.

**Stack:** Electron Forge · Vite · TypeScript · React · Tailwind CSS · electron-store

---

## Credentials

### Production

On first launch, open Settings (tray icon → Settings) and enter:

- **Jira Domain** — e.g. `yourcompany.atlassian.net`
- **Email** — the email associated with your Atlassian account
- **API Token** — generate one at https://id.atlassian.com/manage-profile/security/api-tokens

Credentials are stored in the OS app-data folder via `electron-store` and never written to disk in the project directory.

### Development

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

```
JIRA_DOMAIN=yourcompany.atlassian.net
JIRA_EMAIL=you@example.com
JIRA_TOKEN=your_api_token_here
```

The main process loads this file via `dotenv` in development mode only. If the file is present, credentials are written to `electron-store` automatically on first launch, skipping the settings screen.

`.env` is gitignored — never commit it.

---

## Project structure

`src/` is split by Electron process. Each folder has an entry point named after
itself (`main/main.ts`, `preload/preload.ts`, `renderer/renderer.ts`); the Forge
build output (`main.cjs`, `preload.cjs`) depends on those names. Tests sit next
to the module they cover.

```
src/
├── main/        Main process: tray, popup window, Jira client, stores
├── preload/     contextBridge — the only door between main and renderer
├── renderer/    The Popup UI (React)
│   ├── App.tsx          composes the components below, nothing else
│   ├── components/      one presentational component per file, no electronAPI calls
│   ├── hooks/           use-popup-session: wires IPC, keyboard and clock to the session
│   ├── popup-session.ts the Popup session state machine (pure, unit-tested)
│   └── ui-maps.ts       domain value → CSS colour
├── shared/      Pure domain logic and types used by more than one process
└── assets/      Tray icon sources
```

Rules of thumb: `shared/` never imports from `main/` or `renderer/`; components
receive callbacks as props and only `App.tsx` and the hook touch
`window.electronAPI`.

---

## Dev workflow

```bash
npm start        # launch in dev mode (hot-reload)
npm run package  # build a local app bundle
npm run make     # build distributable (dmg / zip)
```

---

## Build

```bash
npm run make
```

Output is in `out/make/`.
