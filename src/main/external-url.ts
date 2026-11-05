/**
 * Whether a link may be handed to the system to open: only `https`, and
 * without a user name or password in it. The window asks the main process to
 * open links, and a link with another scheme (`file:`, `javascript:`, or one
 * that another app registered) must never get that far.
 */
export function isOpenableUrl(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return false;
  }
  return (
    url.protocol === 'https:' && url.username === '' && url.password === ''
  );
}
