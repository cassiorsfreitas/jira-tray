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
