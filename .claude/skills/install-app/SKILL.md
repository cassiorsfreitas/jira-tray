---
name: install-app
description: Reinstall the packaged app in /Applications. Use when asked to reinstall, update the installed app, or package and move it to Applications.
---

Replace `/Applications/jira-tray.app` with a fresh build of the current working tree. Done when the new bundle sits in `/Applications` and was launched once without crashing.

1. **Quit the app if running.** `pgrep -fl "jira-tray.app/Contents/MacOS"`; if it matches, `osascript -e 'tell application "jira-tray" to quit'` and re-check until it is gone.
2. **Remove the old bundle.** `rm -rf /Applications/jira-tray.app`.
3. **Package fresh.** `rm -rf out && npm run package`. If it fails, report the output and stop; `/Applications` has no app at that point, so say so.
4. **Move it in.** `mv out/jira-tray-darwin-*/jira-tray.app /Applications/` (the folder suffix is the host architecture).
5. **Smoke-test.** `open /Applications/jira-tray.app`, wait a few seconds, confirm the process from step 1 is running, then quit it the same way. Leave it closed; the user starts it themselves.

`codesign -v` on the packaged app reports "invalid Info.plist"; the app still launches, so the smoke test in step 5 is the check that counts.
