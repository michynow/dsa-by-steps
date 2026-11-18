export interface FakeStorage extends Storage {
  readonly entries: Map<string, string>;
}

interface Failures {
  readonly getItem?: Error;
  readonly setItem?: Error;
}

export function createFakeStorage(
  initial: Readonly<Record<string, string>> = {},
  failures: Failures = {},
): FakeStorage {
  const entries = new Map(Object.entries(initial));
  return {
    entries,
    get length() {
      return entries.size;
    },
    clear: () => {
      entries.clear();
    },
    getItem: (key) => {
      if (failures.getItem) throw failures.getItem;
      return entries.get(key) ?? null;
    },
    key: (index) => [...entries.keys()][index] ?? null,
    removeItem: (key) => {
      entries.delete(key);
    },
    setItem: (key, value) => {
      if (failures.setItem) throw failures.setItem;
      entries.set(key, value);
    },
  };
}
