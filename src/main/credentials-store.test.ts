import { describe, it, expect, vi, beforeEach } from 'vitest';

const { data, encryptionAvailable } = vi.hoisted(() => ({
  data: new Map<string, unknown>(),
  encryptionAvailable: { value: true },
}));

vi.mock('electron-store', () => ({
  // Arrow functions cannot be constructors — use a regular function so that
  // `new Store()` works. When a constructor returns an object, JS uses that
  // object as the instance, so this gives us the same mock handle every time.
  default: vi.fn(function MockStore() {
    return {
      get: (key: string) => data.get(key),
      set: (key: string, value: unknown) => data.set(key, value),
    };
  }),
}));

vi.mock('electron', () => ({
  safeStorage: {
    isEncryptionAvailable: () => encryptionAvailable.value,
    encryptString: (text: string) => Buffer.from(`enc:${text}`),
    decryptString: (buffer: Buffer) => {
      const text = buffer.toString();
      if (!text.startsWith('enc:')) throw new Error('cannot decrypt');
      return text.slice('enc:'.length);
    },
  },
}));

// Import after mocks are registered
const { loadCredentials, saveCredentials } =
  await import('./credentials-store');

const CREDS = {
  domain: 'test.atlassian.net',
  email: 'a@b.com',
  token: 'secret-token',
};

beforeEach(() => {
  data.clear();
  encryptionAvailable.value = true;
});

describe('loadCredentials', () => {
  it('returns null when nothing is stored', () => {
    expect(loadCredentials()).toBeNull();
  });

  it('returns what saveCredentials stored', () => {
    saveCredentials(CREDS);
    expect(loadCredentials()).toEqual(CREDS);
  });

  it('returns null when the token can no longer be decrypted', () => {
    data.set('credentials', {
      domain: CREDS.domain,
      email: CREDS.email,
      encryptedToken: 'AAAA',
    });
    expect(loadCredentials()).toBeNull();
  });

  it('migrates plain-text Credentials to encrypted storage', () => {
    data.set('credentials', CREDS);

    expect(loadCredentials()).toEqual(CREDS);

    const stored = data.get('credentials') as Record<string, string>;
    expect(stored).not.toHaveProperty('token');
    expect(JSON.stringify(stored)).not.toContain(CREDS.token);
    expect(loadCredentials()).toEqual(CREDS);
  });

  it('keeps using plain-text Credentials when encryption is not available', () => {
    encryptionAvailable.value = false;
    data.set('credentials', CREDS);

    expect(loadCredentials()).toEqual(CREDS);
    expect(data.get('credentials')).toEqual(CREDS);
  });
});

describe('saveCredentials', () => {
  it('never stores the token as plain text', () => {
    saveCredentials(CREDS);

    const stored = data.get('credentials') as Record<string, string>;
    expect(stored.domain).toBe(CREDS.domain);
    expect(stored.email).toBe(CREDS.email);
    expect(JSON.stringify(stored)).not.toContain(CREDS.token);
  });

  it('refuses to save when encryption is not available', () => {
    encryptionAvailable.value = false;

    expect(() => saveCredentials(CREDS)).toThrow(/secure storage/i);
    expect(data.has('credentials')).toBe(false);
  });
});
