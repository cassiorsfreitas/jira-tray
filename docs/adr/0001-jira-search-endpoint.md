# ADR-0001: Use POST /rest/api/3/search/jql for Jira issue search

**Date:** 2026-10-20
**Status:** Accepted

## Context

The original spec (issue #1) and the Jira Cloud REST API v3 documentation available at design time described `GET /rest/api/3/search?jql=…` as the search endpoint. During manual testing against a live Jira Cloud instance, both `GET /rest/api/3/search` and `POST /rest/api/3/search` returned errors:

- `GET /rest/api/3/search` → `410 Gone` with message: _"The requested API has been removed. Please migrate to the /rest/api/3/search/jql API."_
- `POST /rest/api/3/search` → `400 Bad Request` with message: _"There was an error parsing JSON."_

Atlassian's migration guide (CHANGE-2046) confirmed the retirement and pointed at `/rest/api/3/search/jql` as the replacement.

## Decision

`JiraClient` calls `POST https://<domain>/rest/api/3/search/jql` with the JQL and field list in the JSON request body.

```json
{
  "jql": "assignee = currentUser() AND statusCategory != Done ORDER BY due ASC",
  "fields": ["summary", "status", "priority", "duedate"],
  "maxResults": 50
}
```

## Response shape differences from the retired endpoint

| Old `/rest/api/3/search` | New `/rest/api/3/search/jql` |
| ------------------------ | ---------------------------- |
| `total: number`          | _(absent)_                   |
| `startAt: number`        | _(absent)_                   |
| _(absent)_               | `isLast: boolean`            |
| _(absent)_               | `nextPageToken?: string`     |

The `issues[]` field structure is unchanged.

## Consequences

- Pagination model is cursor-based (`nextPageToken`) rather than offset-based (`startAt`). The MVP fetches only the first page (up to 50 tickets), which is sufficient for personal workload views.
- If pagination is needed in future, pass the `nextPageToken` value from the previous response as `nextPageToken` in the next request body.
- Any future Jira API calls should be verified against a live instance before assuming the documented endpoint is active.
