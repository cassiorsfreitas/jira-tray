import Store from 'electron-store';
import type { JiraCredentials } from './jira-client';

interface StoreSchema {
  credentials?: JiraCredentials;
}

const store = new Store<StoreSchema>();

export function loadCredentials(): JiraCredentials | null {
  return store.get('credentials') ?? null;
}

export function seedCredentialsFromEnv(): void {
  if (store.has('credentials')) return;
  const { JIRA_DOMAIN, JIRA_EMAIL, JIRA_TOKEN } = process.env;
  if (JIRA_DOMAIN && JIRA_EMAIL && JIRA_TOKEN) {
    store.set('credentials', { domain: JIRA_DOMAIN, email: JIRA_EMAIL, token: JIRA_TOKEN });
  }
}
