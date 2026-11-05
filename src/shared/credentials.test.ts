import { describe, expect, it } from 'vitest';
import { normalizeDomain, validateCredentialsInput } from './credentials';

describe('normalizeDomain', () => {
  it.each([
    ['acme.atlassian.net', 'acme.atlassian.net'],
    ['  Acme.Atlassian.NET  ', 'acme.atlassian.net'],
    ['https://acme.atlassian.net', 'acme.atlassian.net'],
    ['http://acme.atlassian.net/', 'acme.atlassian.net'],
    ['https://acme.atlassian.net/jira/your-work', 'acme.atlassian.net'],
    ['acme.atlassian.net?x=1', 'acme.atlassian.net'],
  ])('turns %j into %j', (typed, expected) => {
    expect(normalizeDomain(typed)).toBe(expected);
  });
});

describe('validateCredentialsInput', () => {
  const valid = {
    domain: 'acme.atlassian.net',
    email: 'a@b.com',
    token: 'tok',
  };

  it('accepts complete input and normalises it', () => {
    expect(
      validateCredentialsInput(
        {
          domain: 'https://Acme.atlassian.net/',
          email: ' a@b.com ',
          token: ' tok ',
        },
        null,
      ),
    ).toEqual({ ok: true, credentials: valid });
  });

  it('keeps the stored token when the token field is blank', () => {
    expect(validateCredentialsInput({ ...valid, token: '' }, 'stored')).toEqual(
      {
        ok: true,
        credentials: { ...valid, token: 'stored' },
      },
    );
  });

  it('prefers a newly typed token over the stored one', () => {
    expect(
      validateCredentialsInput({ ...valid, token: 'new' }, 'stored'),
    ).toEqual({
      ok: true,
      credentials: { ...valid, token: 'new' },
    });
  });

  it('rejects a blank token when none is stored', () => {
    expect(validateCredentialsInput({ ...valid, token: '  ' }, null)).toEqual({
      ok: false,
      error: 'Enter your API token.',
    });
  });

  it.each(['', 'acme', 'not a domain', 'acme..net'])(
    'rejects the domain %j',
    (domain) => {
      const result = validateCredentialsInput({ ...valid, domain }, null);
      expect(result.ok).toBe(false);
    },
  );

  it.each(['', 'a', 'a@b', '@b.com', 'a b@c.com'])(
    'rejects the email %j',
    (email) => {
      const result = validateCredentialsInput({ ...valid, email }, null);
      expect(result.ok).toBe(false);
    },
  );
});
