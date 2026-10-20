export type StatusCategory = 'todo' | 'inprogress' | 'inreview' | 'done';
export type Priority = 'highest' | 'high' | 'medium' | 'low' | 'lowest';

export interface Ticket {
  key: string;
  title: string;
  status: string;
  statusCategory: StatusCategory;
  priority: Priority;
  dueDate: string | null;
  url: string;
}

export interface JiraCredentials {
  domain: string;
  email: string;
  token: string;
}

const JQL = 'assignee = currentUser() AND statusCategory != Done ORDER BY due ASC';

function mapStatusCategory(key: string): StatusCategory {
  switch (key) {
    case 'new':
      return 'todo';
    case 'indeterminate':
      return 'inprogress';
    case 'done':
      return 'done';
    default:
      return 'inreview';
  }
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
      statusCategory: { key: string };
    };
    priority: { name: string };
    duedate?: string | null;
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
    body: JSON.stringify({ jql: JQL, fields: ['summary', 'status', 'priority', 'duedate'] }),
  });

  if (!response.ok) {
    throw new Error(`Jira API error: ${response.status} ${response.statusText}`);
  }

  const data = (await response.json()) as { issues: JiraIssue[]; isLast: boolean; nextPageToken?: string };

  return data.issues.map((issue) => ({
    key: issue.key,
    title: issue.fields.summary,
    status: issue.fields.status.name,
    statusCategory: mapStatusCategory(issue.fields.status.statusCategory.key),
    priority: mapPriority(issue.fields.priority.name),
    dueDate: issue.fields.duedate ?? null,
    url: `https://${domain}/browse/${issue.key}`,
  }));
}
