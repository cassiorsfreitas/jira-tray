export type StatusCategory = 'todo' | 'inprogress';

interface ShownStatus {
  /** The Jira Status name, lower-cased. */
  name: string;
  category: StatusCategory;
  /** The Filter Tab label for the category. */
  label: string;
  color: string;
}

// The only Statuses we show, in Filter Tab order. Matched by name rather than
// in the JQL, and categorised by name rather than by Jira's own category: Jira
// can have several Statuses with the same name (e.g. a "To Do" in the
// "indeterminate" category on one project), and a JQL name match only picks one.
// Adding a Status means adding one row.
const SHOWN_STATUSES: readonly ShownStatus[] = [
  {
    name: 'in progress',
    category: 'inprogress',
    label: 'In progress',
    color: '#57c1ff',
  },
  { name: 'to do', category: 'todo', label: 'To do', color: '#9c9c9d' },
];

/** Status Categories in Filter Tab order. */
export const STATUS_CATEGORIES: readonly StatusCategory[] = SHOWN_STATUSES.map(
  (status) => status.category,
);

/** The Status Category of a Status name, or undefined when we don't show it. */
export function statusCategoryOf(
  statusName: string,
): StatusCategory | undefined {
  const name = statusName.trim().toLowerCase();
  return SHOWN_STATUSES.find((status) => status.name === name)?.category;
}

function shownStatus(category: StatusCategory): ShownStatus {
  return SHOWN_STATUSES.find(
    (status) => status.category === category,
  ) as ShownStatus;
}

/** UI copy for a Status Category, e.g. "In progress". */
export function statusCategoryLabel(category: StatusCategory): string {
  return shownStatus(category).label;
}

export function statusColor(category: StatusCategory): string {
  return shownStatus(category).color;
}
