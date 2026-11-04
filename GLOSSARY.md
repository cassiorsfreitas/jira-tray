# Jira Tray

A macOS menu bar application that surfaces the current user's active Jira tickets at a glance, grouped by due-date urgency.

## Language

### Jira integration

**Ticket**:
A Jira issue assigned to the current user fetched via the Jira Cloud REST API.
_Avoid_: Issue, task, card, work item

**Board**:
The name of the Jira project a ticket belongs to. Not a sprint board or scrum board.
_Avoid_: Project, workspace, team

**Status**:
The human-readable workflow state of a ticket as configured in Jira (e.g., "In Progress", "Refinement"). Distinct from Status Category.
_Avoid_: State, stage, workflow step

**Status Category**:
A normalized four-value bucket that groups raw Jira statuses for display purposes: `todo`, `inprogress`, `inreview`, `done`. Derived from Jira's `statusCategory` field, not from the status name itself. `inreview` is the catch-all for any Jira category that is not new, in progress, or done; it does not mean a ticket is literally in review.
_Avoid_: Status type, status group

**Due Date**:
An ISO date string (`YYYY-MM-DD`) representing when a ticket is expected to be completed. Never includes a time component.
_Avoid_: Deadline, target date

**Credentials**:
The three pieces of authentication data required to query Jira: domain, email, and API token. Stored persistently in the OS app-data folder.
_Avoid_: Config, settings, auth, login

**Domain**:
The Atlassian Cloud hostname identifying the user's Jira workspace (e.g., `yourcompany.atlassian.net`). One of the three Credential fields.
_Avoid_: URL, host, workspace, tenant

### Grouping

**Ticket Group**:
One of four time-based buckets into which tickets are partitioned based on their due date: `overdue`, `today`, `upcoming`, or `noDate`. A classification, not a visual section: it determines a ticket's accent colour and its Due Date Badge, while the list itself is flat.
_Avoid_: Section, category, bucket, filter

**Overdue**:
A Ticket whose due date is earlier than today.
_Avoid_: Late, past-due, expired

**Upcoming**:
A Ticket whose due date is later than today.
_Avoid_: Future, scheduled, pending

**No Date**:
A Ticket with no due date set.
_Avoid_: Undated, unscheduled

### Tray & UI

**Tray**:
The persistent macOS menu bar icon that represents the running application. Clicking it opens or closes the Popup.
_Avoid_: Menu bar icon, status bar, status item

**Popup**:
The frameless, always-on-top window that appears below the Tray icon when clicked, left-aligned with the icon's left edge, displaying the ticket list.
_Avoid_: Window, overlay, panel, dropdown

**Alert Icon**:
The Tray icon variant that renders an orange dot, shown when the user has overdue or due-today tickets. Exists in separate light and dark variants to match the system menu bar theme.
_Avoid_: Badge, notification dot, indicator

**Filter Tab**:
One of the tabs above the ticket list that narrows it by Status Category: "All", "In progress", "To do". Tickets with the `inreview` Status Category appear only under "All". The selected Filter Tab persists across Popup openings and app restarts.
_Avoid_: Tab, filter, view

**Sort Order**:
The ordering applied to the ticket list: "Due date" (by Ticket Group urgency, the default) or "Newest first" (by creation date). Persists across Popup openings and app restarts.
_Avoid_: Sorting, ordering, sort mode

**Due Date Badge**:
The label on a ticket row that shows its Due Date: "Overdue", "Today", or a short date for an Upcoming ticket. A No Date ticket has none.
_Avoid_: Tag, chip, pill, due label

**Sync State**:
Whether the last attempt to fetch tickets succeeded, and how long ago: "Synced just now", "Synced 2m ago", or "Sync failed". Shown in the Popup footer.
_Avoid_: Connection status, connected, online
