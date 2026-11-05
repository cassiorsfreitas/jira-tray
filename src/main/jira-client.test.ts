import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchJiraTickets, isAuthError } from './jira-client';

const CREDS = {
  domain: 'mycompany.atlassian.net',
  email: 'user@example.com',
  token: 'api-token-123',
};

const makeIssue = (overrides: Record<string, unknown> = {}) => ({
  key: 'PROJ-1',
  fields: {
    summary: 'Fix the bug',
    status: {
      name: 'In Progress',
      statusCategory: { key: 'indeterminate' },
    },
    duedate: '2026-10-25',
    created: '2026-10-01T09:30:00.000+0000',
    project: { name: 'Platform' },
    ...overrides,
  },
});

function mockFetch(status: number, body: unknown) {
  return vi.spyOn(global, 'fetch').mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    json: () => Promise.resolve(body),
  } as Response);
}

beforeEach(() => {
  vi.restoreAllMocks();
});

// --- Slice 1: Basic Auth header ---
describe('Basic Auth header', () => {
  it('sends Authorization: Basic base64(email:token)', async () => {
    const fetchSpy = mockFetch(200, { issues: [makeIssue()], isLast: true });

    await fetchJiraTickets(CREDS);

    const [, init] = fetchSpy.mock.calls[0];
    const headers = init?.headers as Record<string, string>;
    const expected = 'Basic ' + btoa('user@example.com:api-token-123');
    expect(headers['Authorization']).toBe(expected);
  });
});

// --- Slice 2: JQL in request ---
describe('JQL query', () => {
  it('includes the correct JQL in the POST body', async () => {
    const fetchSpy = mockFetch(200, { issues: [makeIssue()], isLast: true });

    await fetchJiraTickets(CREDS);

    const [, init] = fetchSpy.mock.calls[0];
    const body = JSON.parse(init?.body as string);
    expect(body.jql).toBe(
      'assignee = currentUser() AND statusCategory != Done ORDER BY due ASC',
    );
  });

  it('asks Jira for the created field', async () => {
    const fetchSpy = mockFetch(200, { issues: [makeIssue()], isLast: true });

    await fetchJiraTickets(CREDS);

    const [, init] = fetchSpy.mock.calls[0];
    const body = JSON.parse(init?.body as string);
    expect(body.fields).toContain('created');
  });

  it('POSTs to the correct Jira Cloud search endpoint', async () => {
    const fetchSpy = mockFetch(200, { issues: [makeIssue()], isLast: true });

    await fetchJiraTickets(CREDS);

    const [url, init] = fetchSpy.mock.calls[0];
    expect(url).toBe('https://mycompany.atlassian.net/rest/api/3/search/jql');
    expect(init?.method).toBe('POST');
  });
});

// --- Slice 3: Full normalisation ---
describe('Ticket normalisation', () => {
  it('maps a Jira issue to the agreed Ticket shape', async () => {
    mockFetch(200, {
      issues: [
        makeIssue({
          summary: 'Fix the bug',
          status: {
            name: 'In Progress',
            statusCategory: { key: 'indeterminate' },
          },
          duedate: '2026-10-25',
        }),
      ],
      isLast: true,
    });

    const tickets = await fetchJiraTickets(CREDS);

    expect(tickets).toEqual([
      {
        key: 'PROJ-1',
        title: 'Fix the bug',
        status: 'In Progress',
        statusCategory: 'inprogress',
        dueDate: '2026-10-25',
        created: '2026-10-01T09:30:00.000+0000',
        url: 'https://mycompany.atlassian.net/browse/PROJ-1',
        board: 'Platform',
      },
    ]);
  });

  it('returns an empty array when issues list is empty', async () => {
    mockFetch(200, { issues: [], isLast: true });

    const tickets = await fetchJiraTickets(CREDS);

    expect(tickets).toEqual([]);
  });
});

// --- Slice 4: dueDate null ---
describe('dueDate handling', () => {
  it('sets dueDate to null when Jira returns no due date', async () => {
    mockFetch(200, { issues: [makeIssue({ duedate: null })], isLast: true });

    const [ticket] = await fetchJiraTickets(CREDS);

    expect(ticket.dueDate).toBeNull();
  });

  it('sets dueDate to null when Jira omits the duedate field', async () => {
    const issue = makeIssue();
    // @ts-expect-error — intentionally omitting duedate
    delete issue.fields.duedate;
    mockFetch(200, { issues: [issue], isLast: true });

    const [ticket] = await fetchJiraTickets(CREDS);

    expect(ticket.dueDate).toBeNull();
  });
});

// --- Status filtering ---
describe('Status filtering', () => {
  const issueWithStatus = (
    key: string,
    name: string,
    categoryKey = 'indeterminate',
  ) => ({
    ...makeIssue({ status: { name, statusCategory: { key: categoryKey } } }),
    key,
  });

  it('keeps only Tickets whose Status is To Do or In Progress', async () => {
    mockFetch(200, {
      issues: [
        issueWithStatus('A-1', 'To Do', 'new'),
        issueWithStatus('A-2', 'In Progress'),
        issueWithStatus('A-3', 'Development'),
        issueWithStatus('A-4', 'In Review'),
        issueWithStatus('A-5', 'Refinement', 'new'),
      ],
      isLast: true,
    });

    const tickets = await fetchJiraTickets(CREDS);

    expect(tickets.map((ticket) => ticket.key)).toEqual(['A-1', 'A-2']);
  });

  it('keeps a "To Do" Status whatever its Status Category (two Jira Statuses can share the name)', async () => {
    mockFetch(200, {
      issues: [
        issueWithStatus('TT-1', 'To Do', 'new'),
        issueWithStatus('MI-1', 'To Do', 'indeterminate'),
      ],
      isLast: true,
    });

    const tickets = await fetchJiraTickets(CREDS);

    expect(tickets.map((ticket) => ticket.key)).toEqual(['TT-1', 'MI-1']);
  });

  it('matches the Status name case-insensitively', async () => {
    mockFetch(200, {
      issues: [
        issueWithStatus('A-1', 'TO DO', 'new'),
        issueWithStatus('A-2', ' in progress '),
      ],
      isLast: true,
    });

    const tickets = await fetchJiraTickets(CREDS);

    expect(tickets.map((ticket) => ticket.key)).toEqual(['A-1', 'A-2']);
  });
});

// --- Slice 6: Error handling ---
describe('error handling', () => {
  it('throws when the response is non-2xx', async () => {
    mockFetch(401, { errorMessages: ['Unauthorized'] });

    await expect(fetchJiraTickets(CREDS)).rejects.toThrow('401');
  });

  it('throws when fetch rejects (network failure)', async () => {
    vi.spyOn(global, 'fetch').mockRejectedValue(new Error('Network error'));

    await expect(fetchJiraTickets(CREDS)).rejects.toThrow('Network error');
  });
});

describe('isAuthError', () => {
  it.each([401, 403])('is true when Jira answers %i', async (status) => {
    mockFetch(status, { errorMessages: ['nope'] });

    const error = await fetchJiraTickets(CREDS).catch((err: unknown) => err);

    expect(isAuthError(error)).toBe(true);
  });

  it.each([404, 429, 500, 503])(
    'is false when Jira answers %i',
    async (status) => {
      mockFetch(status, {});

      const error = await fetchJiraTickets(CREDS).catch((err: unknown) => err);

      expect(isAuthError(error)).toBe(false);
    },
  );

  it('is false for a network failure', async () => {
    vi.spyOn(global, 'fetch').mockRejectedValue(new Error('Network error'));

    const error = await fetchJiraTickets(CREDS).catch((err: unknown) => err);

    expect(isAuthError(error)).toBe(false);
  });

  it('is false for anything that is not an error', () => {
    expect(isAuthError('401')).toBe(false);
    expect(isAuthError(undefined)).toBe(false);
  });
});
