import { describe, expect, it } from 'vitest';
import {
  STATUS_CATEGORIES,
  statusCategoryLabel,
  statusCategoryOf,
  statusColor,
} from './status';

describe('statusCategoryOf', () => {
  // By Status name, not by Jira's own Status Category: two Jira Statuses can
  // share the name "To Do", and one of them can sit in the "indeterminate"
  // category. Nothing here takes Jira's category, so both come out the same.
  it('categorises "To Do" as todo', () => {
    expect(statusCategoryOf('To Do')).toBe('todo');
  });

  it('categorises "In Progress" as inprogress', () => {
    expect(statusCategoryOf('In Progress')).toBe('inprogress');
  });

  it('matches the Status name case-insensitively and ignoring surrounding space', () => {
    expect(statusCategoryOf(' to do ')).toBe('todo');
    expect(statusCategoryOf('IN PROGRESS')).toBe('inprogress');
  });

  it('returns undefined for a Status we do not show', () => {
    for (const name of ['Development', 'In Review', 'Refinement', 'Done']) {
      expect(statusCategoryOf(name)).toBeUndefined();
    }
  });
});

describe('STATUS_CATEGORIES', () => {
  it('lists the Status Categories in Filter Tab order', () => {
    expect(STATUS_CATEGORIES).toEqual(['inprogress', 'todo']);
  });
});

describe('statusCategoryLabel', () => {
  it('gives the Filter Tab copy for each Status Category', () => {
    expect(statusCategoryLabel('inprogress')).toBe('In progress');
    expect(statusCategoryLabel('todo')).toBe('To do');
  });
});

describe('statusColor', () => {
  it('colours todo grey and inprogress blue', () => {
    expect(statusColor('todo')).toBe('#9c9c9d');
    expect(statusColor('inprogress')).toBe('#57c1ff');
  });
});
