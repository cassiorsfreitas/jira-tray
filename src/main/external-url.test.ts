import { describe, expect, it } from 'vitest';
import { isOpenableUrl } from './external-url';

describe('isOpenableUrl', () => {
  it.each([
    'https://yourcompany.atlassian.net/browse/APP-1',
    'https://id.atlassian.com/manage-profile/security/api-tokens',
    'https://example.com',
    'HTTPS://EXAMPLE.COM/path?query=1#hash',
  ])('accepts %j', (url) => {
    expect(isOpenableUrl(url)).toBe(true);
  });

  it.each([
    'http://yourcompany.atlassian.net/browse/APP-1',
    'file:///etc/hosts',
    'javascript:alert(1)',
    'data:text/html,<script>alert(1)</script>',
    'ftp://example.com/file',
    'smb://server/share',
    'vnc://host',
    'x-apple.systempreferences:com.apple.preference.security',
    'mailto:someone@example.com',
    'about:blank',
    'blob:https://example.com/1234',
  ])('rejects the scheme in %j', (url) => {
    expect(isOpenableUrl(url)).toBe(false);
  });

  it.each([
    'https://user@example.com/',
    'https://user:secret@example.com/',
    'https://:secret@example.com/',
  ])('rejects the credentials in %j', (url) => {
    expect(isOpenableUrl(url)).toBe(false);
  });

  it.each(['', ' ', 'example.com', '//example.com', 'https://', 'not a url'])(
    'rejects the malformed %j',
    (url) => {
      expect(isOpenableUrl(url)).toBe(false);
    },
  );

  it.each([undefined, null, 42, {}, ['https://example.com'], true])(
    'rejects the non-string %j',
    (value) => {
      expect(isOpenableUrl(value)).toBe(false);
    },
  );
});
