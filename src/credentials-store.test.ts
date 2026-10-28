import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockGet, mockSet, mockHas } = vi.hoisted(() => ({
  mockGet: vi.fn(),
  mockSet: vi.fn(),
  mockHas: vi.fn(),
}));

vi.mock('electron-store', () => ({
  // Arrow functions cannot be constructors — use a regular function so that
  // `new Store()` works. When a constructor returns an object, JS uses that
  // object as the instance, so this gives us the same mock handle every time.
  default: vi.fn(function MockStore() {
    return { get: mockGet, set: mockSet, has: mockHas };
  }),
}));

// Import after mock is registered
const { loadCredentials, seedCredentialsFromEnv } = await import('./credentials-store');

describe('loadCredentials', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns stored credentials when present', () => {
    const creds = { domain: 'test.atlassian.net', email: 'a@b.com', token: 'tok' };
    mockGet.mockReturnValue(creds);
    expect(loadCredentials()).toEqual(creds);
    expect(mockGet).toHaveBeenCalledWith('credentials');
  });

  it('returns null when store has no credentials', () => {
    mockGet.mockReturnValue(undefined);
    expect(loadCredentials()).toBeNull();
  });
});

describe('seedCredentialsFromEnv', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.JIRA_DOMAIN;
    delete process.env.JIRA_EMAIL;
    delete process.env.JIRA_TOKEN;
  });

  it('does nothing when store already has credentials', () => {
    mockHas.mockReturnValue(true);
    seedCredentialsFromEnv();
    expect(mockSet).not.toHaveBeenCalled();
  });

  it('writes env credentials to store when store is empty and all env vars are set', () => {
    mockHas.mockReturnValue(false);
    process.env.JIRA_DOMAIN = 'test.atlassian.net';
    process.env.JIRA_EMAIL = 'a@b.com';
    process.env.JIRA_TOKEN = 'mytoken';

    seedCredentialsFromEnv();

    expect(mockSet).toHaveBeenCalledWith('credentials', {
      domain: 'test.atlassian.net',
      email: 'a@b.com',
      token: 'mytoken',
    });
  });

  it('does not write when JIRA_DOMAIN is missing', () => {
    mockHas.mockReturnValue(false);
    process.env.JIRA_EMAIL = 'a@b.com';
    process.env.JIRA_TOKEN = 'mytoken';

    seedCredentialsFromEnv();

    expect(mockSet).not.toHaveBeenCalled();
  });

  it('does not write when JIRA_EMAIL is missing', () => {
    mockHas.mockReturnValue(false);
    process.env.JIRA_DOMAIN = 'test.atlassian.net';
    process.env.JIRA_TOKEN = 'mytoken';

    seedCredentialsFromEnv();

    expect(mockSet).not.toHaveBeenCalled();
  });

  it('does not write when JIRA_TOKEN is missing', () => {
    mockHas.mockReturnValue(false);
    process.env.JIRA_DOMAIN = 'test.atlassian.net';
    process.env.JIRA_EMAIL = 'a@b.com';

    seedCredentialsFromEnv();

    expect(mockSet).not.toHaveBeenCalled();
  });
});
