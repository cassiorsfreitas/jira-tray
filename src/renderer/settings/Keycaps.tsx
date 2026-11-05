/** A key combination as one chip per key, e.g. `['⌘', 'K']`. */
export function Keycaps({
  keys,
  tone = 'default',
}: {
  keys: string[];
  /** `accent` marks the combination being recorded; `muted` a placeholder. */
  tone?: 'default' | 'accent' | 'muted';
}) {
  return (
    <span style={{ display: 'inline-flex', gap: 4 }}>
      {keys.map((key, i) => (
        <kbd key={`${i}-${key}`} className={`keycap keycap-${tone}`}>
          {key}
        </kbd>
      ))}
    </span>
  );
}
