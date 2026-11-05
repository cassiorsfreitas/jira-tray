# Security policy

## Supported versions

Jira Tray is built from source and has no releases. Only the latest commit on `main` is supported. Please check that the problem is still there on `main` before you report it.

## Reporting a vulnerability

Please report it privately, not in a public issue.

1. Open the [**Security** tab](https://github.com/cassiorsfreitas/jira-tray/security) of this repository and choose **Report a vulnerability** (or go straight to the [report form](https://github.com/cassiorsfreitas/jira-tray/security/advisories/new)).
2. Say what you found, how to reproduce it and what an attacker could do with it. Add the commit you tested and your macOS version.

Never put a real API token or private Jira content in a report.

Jira Tray is maintained by one person in their spare time, so everything here is best effort. The aim is to reply within about a week and to say what will be done. Please give a fix time before you disclose the problem publicly.

## What counts as a vulnerability

In scope:

- How the app stores, sends or exposes the API token or your Jira data.
- How it uses the macOS Keychain.
- The bridge between the app's windows and its main process (`src/preload/`, and the handlers in `src/main/main.ts`).
- Anything that makes the app run code, or open something, that the user did not ask for.
- The packaging and signing configuration (`forge.config.mts`).

Out of scope:

- Weaknesses in Jira, Atlassian or macOS themselves.
- The app being signed ad hoc and not notarized. That is by design and described in the [README](README.md#install).
- Attacks that already need access to an unlocked Mac and your account, since that access can read your Keychain anyway.

## How the app protects your data

- It only talks to your Jira site, over HTTPS, to read your tickets. There is no analytics, telemetry or automatic update.
- The API token is encrypted with the macOS Keychain (Electron `safeStorage`). After you save it, the windows never get it back: Settings only learns whether a token exists.
- The windows load only the app's own bundled pages, with context isolation on and Node integration off.
- The packaged app uses Electron fuses so that it cannot run as plain Node, cannot be started with Node debugging flags, and loads only from its own application archive, whose integrity it checks.

## If your token may have leaked

Revoke it at [id.atlassian.com](https://id.atlassian.com/manage-profile/security/api-tokens), create a new one, and enter it again in Settings.
