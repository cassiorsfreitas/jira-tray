import { safeStorage } from 'electron';
import Store from 'electron-store';
import type { JiraCredentials } from '../shared/credentials';

/** The token is encrypted with the macOS Keychain (Electron `safeStorage`), then base64-encoded. */
interface StoredCredentials {
  domain: string;
  email: string;
  encryptedToken: string;
}

/** Written by versions that kept the token as plain text. */
interface LegacyCredentials {
  domain: string;
  email: string;
  token: string;
}

interface StoreSchema {
  credentials?: StoredCredentials | LegacyCredentials;
}

const store = new Store<StoreSchema>();

function isLegacy(
  stored: StoredCredentials | LegacyCredentials,
): stored is LegacyCredentials {
  return 'token' in stored;
}

export function saveCredentials({
  domain,
  email,
  token,
}: JiraCredentials): void {
  if (!safeStorage.isEncryptionAvailable()) {
    throw new Error(
      'Secure storage is not available on this Mac, so the token cannot be saved safely.',
    );
  }
  const encryptedToken = safeStorage.encryptString(token).toString('base64');
  store.set('credentials', { domain, email, encryptedToken });
}

/** The stored Credentials, or null when there are none or the token can no longer be decrypted. */
export function loadCredentials(): JiraCredentials | null {
  const stored = store.get('credentials');
  if (!stored) return null;

  if (isLegacy(stored)) {
    const { domain, email, token } = stored;
    // Move the plain-text token into encrypted storage; keep working if that is not possible.
    if (safeStorage.isEncryptionAvailable())
      saveCredentials({ domain, email, token });
    return { domain, email, token };
  }

  try {
    const token = safeStorage.decryptString(
      Buffer.from(stored.encryptedToken, 'base64'),
    );
    return { domain: stored.domain, email: stored.email, token };
  } catch {
    // The Keychain entry changed or was reset: the user has to enter the token again.
    return null;
  }
}
