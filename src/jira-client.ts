export type StatusCategory = 'todo' | 'inprogress' | 'inreview' | 'done';
export type Priority = 'highest' | 'high' | 'medium' | 'low' | 'lowest';

export interface Ticket {
  key: string;
  title: string;
  status: string;
  statusCategory: StatusCategory;
  priority: Priority;
  dueDate: string | null;
  /** Creation timestamp as returned by Jira's `created` field (e.g. 2026-10-01T09:30:00.000+0000). */
  created: string;
  url: string;
  board: string;
}

export interface JiraCredentials {
  domain: string;
  email: string;
  token: string;
}

const JQL = 'assignee = currentUser() AND statusCategory != Done ORDER BY due ASC';

// The only Statuses we show, and the Status Category each one gets. Matched by
// name here rather than in the JQL, and categorised by name rather than by
// Jira's own category: Jira can have several Statuses with the same name (e.g.
// a "To Do" in the "indeterminate" category on one project), and a JQL name
// match only picks one.
const SHOWN_STATUSES = new Map<string, StatusCategory>([
  ['to do', 'todo'],
  ['in progress', 'inprogress'],
]);

function shownStatusCategory(statusName: string): StatusCategory | undefined {
  return SHOWN_STATUSES.get(statusName.trim().toLowerCase());
}

function mapPriority(name: string): Priority {
  switch (name.toLowerCase()) {
    case 'highest':
      return 'highest';
    case 'high':
      return 'high';
    case 'low':
      return 'low';
    case 'lowest':
      return 'lowest';
    default:
      return 'medium';
  }
}

interface JiraIssue {
  key: string;
  fields: {
    summary: string;
    status: {
      name: string;
    };
    priority: { name: string };
    duedate?: string | null;
    created: string;
    project: { name: string };
  };
}

export async function fetchJiraTickets({ domain, email, token }: JiraCredentials): Promise<Ticket[]> {
  const response = await fetch(`https://${domain}/rest/api/3/search/jql`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${btoa(`${email}:${token}`)}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ jql: JQL, fields: ['summary', 'status', 'priority', 'duedate', 'created', 'project'] }),
  });

  if (!response.ok) {
    throw new Error(`Jira API error: ${response.status} ${response.statusText}`);
  }

  const data = (await response.json()) as { issues: JiraIssue[]; isLast: boolean; nextPageToken?: string };

  return data.issues.flatMap((issue) => {
    const statusCategory = shownStatusCategory(issue.fields.status.name);
    if (!statusCategory) return [];
    return {
      key: issue.key,
      title: issue.fields.summary,
      status: issue.fields.status.name,
      statusCategory,
      priority: mapPriority(issue.fields.priority.name),
      dueDate: issue.fields.duedate ?? null,
      created: issue.fields.created,
      url: `https://${domain}/browse/${issue.key}`,
      board: issue.fields.project.name,
    };
  });
}
