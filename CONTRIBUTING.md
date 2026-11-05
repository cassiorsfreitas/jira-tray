# Contributing to Jira Tray

Thanks for helping. Bug reports, ideas and pull requests are all welcome.

## Before you start

- **Found a bug?** [Open an issue](https://github.com/cassiorsfreitas/jira-tray/issues/new) with what you did, what you expected and what happened. Add your macOS version, and the error text if the popup shows one. Never paste your API token.
- **Want a feature or a bigger change?** Open an issue first, so we can agree on the idea before you spend time on it.
- Small fixes (typos, a clear bug) can go straight to a pull request.

Jira Tray is macOS only. Changes that add Windows or Linux support are out of scope.

## Set up

You need macOS, Node.js 22.13 or newer, and npm.

```bash
git clone https://github.com/cassiorsfreitas/jira-tray.git
cd jira-tray
npm install
npm start
```

`npm start` launches the app in development mode with hot reload. Click the menu bar icon, then the Settings button, to connect a Jira account (see the [README](README.md#first-run)).

A few things to know while developing:

- The development app shares its data folder (`~/Library/Application Support/Jira Tray`), its Keychain item and its global shortcut with an installed Jira Tray. Quit the installed one first, or only one of them gets the shortcut.
- To start from a clean slate, give it a throwaway data folder: `npm start -- -- --user-data-dir=/tmp/jira-tray-dev`.
- There are no environment variables and no `.env` file. Credentials are entered in Settings.

## Scripts

| Command                     | What it does                                           |
| --------------------------- | ------------------------------------------------------ |
| `npm start`                 | Run in development mode                                |
| `npm run package`           | Build `out/Jira Tray-darwin-<arch>/Jira Tray.app`      |
| `npm run make`              | Build the app and zip it under `out/make/`             |
| `npm test`                  | Run the unit tests (Vitest)                            |
| `npm run typecheck`         | Type-check with `tsc`                                  |
| `npm run lint`              | Run oxlint and check formatting with oxfmt             |
| `npm run lint:fix`          | Fix what oxlint and oxfmt can fix                      |
| `npm run generate-icons`    | Print the base64 Tray icons from `src/assets/*.svg`    |
| `npm run generate-app-icon` | Rebuild `src/assets/app-icon.icns` from `app-icon.svg` |

Before you open a pull request, run `npm run typecheck`, `npm test`, and `npm run lint:fix` on the files you touched.

## Project layout

`src/` is split by Electron process. Each folder has an entry point named after itself (`main/main.ts`, `preload/preload.ts`, `renderer/renderer.ts`); the Forge build output (`main.cjs`, `preload.cjs`) depends on those names. Tests sit next to the module they cover.

```
src/
├── main/        Main process: Tray, Popup and Settings windows, Jira client,
│                the stores (Credentials, preferences, shortcut), the global shortcut
├── preload/     contextBridge: the only door between main and renderer
├── renderer/    Everything drawn in a window; one bundle for both windows
│   ├── App.tsx          the Popup; composes the components below, nothing else
│   ├── components/      one presentational component per file, no electronAPI calls
│   ├── hooks/           use-popup-session: wires IPC, keyboard and clock to the session
│   ├── popup-session.ts the Popup session state machine (pure, unit-tested)
│   ├── settings/        the Settings window (loaded with the #settings hash)
│   └── ui-maps.ts       domain value → CSS colour
├── shared/      Pure domain logic and types used by more than one process
└── assets/      Tray icon and app icon sources
```

Rules of thumb:

- `shared/` never imports from `main/` or `renderer/`.
- Components receive callbacks as props; only `App.tsx`, the hooks and the Settings panes touch `window.electronAPI`.
- Put logic in a pure module with a test (the way `popup-session.ts`, `shortcut.ts` and `ticket-list-view.ts` are), and keep the Electron and DOM wiring thin.
- The renderer never sees the API token: it goes to the main process, is encrypted with `safeStorage`, and stays there.

### Packaging

`forge.config.mts` signs the finished app ad hoc. Do not remove that: editing `Info.plist` and flipping the fuses break the signature that ships with Electron, and macOS then refuses the app any Keychain access, so Settings cannot save the token. After packaging, `codesign -v "out/Jira Tray-darwin-<arch>/Jira Tray.app"` must print nothing.

## Language

The project has a shared vocabulary in [GLOSSARY.md](GLOSSARY.md): **Ticket**, **Credentials**, **Popup**, **Settings window**, **Filter Tab**, **Sort Order** and so on. Use those words in code, issues and pull requests, and avoid the synonyms the glossary lists. Decisions that are not obvious from the code are recorded in [docs/adr/](docs/adr/).

## Tests

Tests run with `npm test` and live next to the code (`foo.ts` and `foo.test.ts`). Add or update a test with your change. The Electron parts that cannot run in a test, such as the Keychain or the global shortcut, are kept behind small interfaces so the logic around them can be tested (see `toggle-shortcut.ts`). If you changed what the app looks like or does, say how you checked it in the pull request; a screenshot helps.

## Commits and pull requests

- Branch from `main`, one concern per branch.
- Commit messages follow [Conventional Commits](https://www.conventionalcommits.org/): `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`. Write the subject in the imperative and keep it short; use the body to say **why**.
- The pull request template asks for what changed and why, how you checked it, and what could break. Link the issue it closes.
- CI runs `lint`, `typecheck` and `test`, and packages the app to check its signature, on every pull request. They need to pass before it is merged.

## License

By contributing you agree that your work is released under the [MIT License](LICENSE).
