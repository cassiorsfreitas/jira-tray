import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchJiraTickets } from './jira-client';

const CREDS = { domain: 'mycompany.atlassian.net', email: 'user@example.com', token: 'api-token-123' };

const makeIssue = (overrides: Record<string, unknown> = {}) => ({
  key: 'PROJ-1',
  fields: {
    summary: 'Fix the bug',
    status: {
      name: 'In Progress',
      statusCategory: { key: 'indeterminate' },
    },
    priority: { name: 'High' },
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
    expect(body.jql).toBe('assignee = currentUser() AND status in ("To Do", "In Progress") ORDER BY due ASC');
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
          status: { name: 'In Progress', statusCategory: { key: 'indeterminate' } },
          priority: { name: 'High' },
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
        priority: 'high',
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

// --- Slice 5: statusCategory derivation ---
describe('statusCategory derivation', () => {
  const cases: [string, string][] = [
    ['new', 'todo'],
    ['indeterminate', 'inprogress'],
    ['done', 'done'],
    ['in_review', 'inreview'],
  ];

  for (const [categoryKey, expected] of cases) {
    it(`maps category key "${categoryKey}" → "${expected}"`, async () => {
      mockFetch(200, {
        issues: [
          makeIssue({
            status: { name: 'Some Status', statusCategory: { key: categoryKey } },
          }),
        ],
        isLast: true,
      });

      const [ticket] = await fetchJiraTickets(CREDS);

      expect(ticket.statusCategory).toBe(expected);
    });
  }
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
