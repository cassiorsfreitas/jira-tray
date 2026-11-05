/** The three pieces of authentication data required to query Jira. */
export interface JiraCredentials {
  domain: string;
  email: string;
  token: string;
}

/** What the Settings screen submits. A blank token means "keep the stored one". */
export interface CredentialsInput {
  domain: string;
  email: string;
  token: string;
}

/** What the renderer may know about the stored Credentials: never the token. */
export interface CredentialsSummary {
  domain: string;
  email: string;
  hasToken: boolean;
}

export type CredentialsResult = { ok: true } | { ok: false; error: string };

export type ValidatedCredentials =
  | { ok: true; credentials: JiraCredentials }
  | { ok: false; error: string };

/** `https://Acme.atlassian.net/jira/` → `acme.atlassian.net`. */
export function normalizeDomain(value: string): string {
  return value
    .trim()
    .replace(/^https?:\/\//i, '')
    .split(/[/?#]/)[0]
    .toLowerCase();
}

const HOSTNAME =
  /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Checks what the user typed and fills in the stored token when they left the
 * token field blank, so editing the Domain or Email does not mean pasting the
 * token again.
 */
export function validateCredentialsInput(
  input: CredentialsInput,
  storedToken: string | null,
): ValidatedCredentials {
  const domain = normalizeDomain(input.domain);
  if (!HOSTNAME.test(domain)) {
    return {
      ok: false,
      error: 'Enter your Jira domain, e.g. yourcompany.atlassian.net.',
    };
  }

  const email = input.email.trim();
  if (!EMAIL.test(email)) {
    return { ok: false, error: 'Enter the email of your Atlassian account.' };
  }

  const token = input.token.trim() || storedToken;
  if (!token) {
    return { ok: false, error: 'Enter your API token.' };
  }

  return { ok: true, credentials: { domain, email, token } };
}
