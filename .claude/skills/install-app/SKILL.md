---
name: install-app
description: Reinstall the packaged app in /Applications. Use when asked to reinstall, update the installed app, or package and move it to Applications.
---

Replace `/Applications/Jira Tray.app` with a fresh build of the current working tree. Done when the new bundle sits in `/Applications` and was launched once without crashing.

1. **Quit the app if running.** `pgrep -fl "Jira Tray.app/Contents/MacOS"`; if it matches, `osascript -e 'tell application "Jira Tray" to quit'` and re-check until it is gone.
2. **Remove the old bundle.** `rm -rf "/Applications/Jira Tray.app"`. Builds from before the rename are called `jira-tray.app`; remove that one too if it is there.
3. **Package fresh.** `rm -rf out && npm run package`. If it fails, report the output and stop; `/Applications` has no app at that point, so say so.
4. **Move it in.** `mv out/*-darwin-*/"Jira Tray.app" /Applications/` (the folder suffix is the host architecture).
5. **Smoke-test.** `open "/Applications/Jira Tray.app"`, wait a few seconds, confirm the process from step 1 is running, then quit it the same way. Leave it closed; the user starts it themselves.

`codesign -v "/Applications/Jira Tray.app"` must print nothing. If it says "invalid Info.plist", the ad-hoc re-signing in `forge.config.mts` was lost: macOS refuses such an app any Keychain access, so Settings cannot save the API token ("Secure storage is not available"). The first time a new build touches the Keychain, macOS asks to allow it; the answer is "Always Allow".
