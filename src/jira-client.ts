import { statusCategoryOf } from './status';
import type { StatusCategory } from './status';

export interface Ticket {
  key: string;
  title: string;
  status: string;
  statusCategory: StatusCategory;
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

interface JiraIssue {
  key: string;
  fields: {
    summary: string;
    status: {
      name: string;
    };
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
    body: JSON.stringify({ jql: JQL, fields: ['summary', 'status', 'duedate', 'created', 'project'] }),
  });

  if (!response.ok) {
    throw new Error(`Jira API error: ${response.status} ${response.statusText}`);
  }

  const data = (await response.json()) as { issues: JiraIssue[]; isLast: boolean; nextPageToken?: string };

  return data.issues.flatMap((issue) => {
    const statusCategory = statusCategoryOf(issue.fields.status.name);
    if (!statusCategory) return [];
    return {
      key: issue.key,
      title: issue.fields.summary,
      status: issue.fields.status.name,
      statusCategory,
      dueDate: issue.fields.duedate ?? null,
      created: issue.fields.created,
      url: `https://${domain}/browse/${issue.key}`,
      board: issue.fields.project.name,
    };
  });
}
