import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockGet, mockSet } = vi.hoisted(() => ({
  mockGet: vi.fn(),
  mockSet: vi.fn(),
}));

vi.mock('electron-store', () => ({
  // Arrow functions cannot be constructors — use a regular function so that
  // `new Store()` works. When a constructor returns an object, JS uses that
  // object as the instance, so this gives us the same mock handle every time.
  default: vi.fn(function MockStore() {
    return { get: mockGet, set: mockSet };
  }),
}));

// Import after mock is registered
const { loadPreferences, savePreferences } =
  await import('./preferences-store');

describe('loadPreferences', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns the stored Filter Tab and Sort Order', () => {
    mockGet.mockReturnValue({ filterTab: 'todo', sortOrder: 'newest' });
    expect(loadPreferences()).toEqual({
      filterTab: 'todo',
      sortOrder: 'newest',
    });
    expect(mockGet).toHaveBeenCalledWith('preferences');
  });

  it('falls back to "All" and "Due date" when nothing is stored', () => {
    mockGet.mockReturnValue(undefined);
    expect(loadPreferences()).toEqual({
      filterTab: 'all',
      sortOrder: 'dueDate',
    });
  });

  it('falls back to the default for a missing field', () => {
    mockGet.mockReturnValue({ filterTab: 'inprogress' });
    expect(loadPreferences()).toEqual({
      filterTab: 'inprogress',
      sortOrder: 'dueDate',
    });
  });

  it('falls back to the default for an unknown Filter Tab', () => {
    mockGet.mockReturnValue({ filterTab: 'inreview', sortOrder: 'newest' });
    expect(loadPreferences()).toEqual({
      filterTab: 'all',
      sortOrder: 'newest',
    });
  });

  it('falls back to the default for an unknown Sort Order', () => {
    mockGet.mockReturnValue({ filterTab: 'todo', sortOrder: 'priority' });
    expect(loadPreferences()).toEqual({
      filterTab: 'todo',
      sortOrder: 'dueDate',
    });
  });

  it('falls back to the defaults when the stored value is not an object', () => {
    mockGet.mockReturnValue('garbage');
    expect(loadPreferences()).toEqual({
      filterTab: 'all',
      sortOrder: 'dueDate',
    });
  });
});

describe('savePreferences', () => {
  beforeEach(() => vi.clearAllMocks());

  it('writes the Filter Tab and Sort Order under the preferences key', () => {
    savePreferences({ filterTab: 'inprogress', sortOrder: 'newest' });
    expect(mockSet).toHaveBeenCalledWith('preferences', {
      filterTab: 'inprogress',
      sortOrder: 'newest',
    });
  });

  it('keeps the stored Sort Order when only the Filter Tab changes', () => {
    mockGet.mockReturnValue({ filterTab: 'all', sortOrder: 'newest' });
    savePreferences({ filterTab: 'todo' });
    expect(mockSet).toHaveBeenCalledWith('preferences', {
      filterTab: 'todo',
      sortOrder: 'newest',
    });
  });

  it('keeps the stored Filter Tab when only the Sort Order changes', () => {
    mockGet.mockReturnValue({ filterTab: 'todo', sortOrder: 'dueDate' });
    savePreferences({ sortOrder: 'newest' });
    expect(mockSet).toHaveBeenCalledWith('preferences', {
      filterTab: 'todo',
      sortOrder: 'newest',
    });
  });

  it('never writes the search text', () => {
    savePreferences({
      filterTab: 'todo',
      sortOrder: 'newest',
      searchText: 'PROJ-1',
    } as never);
    expect(mockSet).toHaveBeenCalledTimes(1);
    expect(mockSet.mock.calls[0][1]).toEqual({
      filterTab: 'todo',
      sortOrder: 'newest',
    });
  });

  it('does not write an invalid value', () => {
    mockGet.mockReturnValue(undefined);
    savePreferences({ filterTab: 'bogus', sortOrder: 'nope' } as never);
    expect(mockSet).toHaveBeenCalledWith('preferences', {
      filterTab: 'all',
      sortOrder: 'dueDate',
    });
  });
});
