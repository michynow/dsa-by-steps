export interface ReducedMotionStub {
  readonly set: (matches: boolean) => void;
}

export function stubReducedMotion(initial: boolean): ReducedMotionStub {
  const listeners = new Set<() => void>();
  let current = initial;
  vi.stubGlobal('matchMedia', (query: string) => ({
    get matches() {
      return query === '(prefers-reduced-motion: reduce)' && current;
    },
    addEventListener: (_type: string, listener: () => void) => {
      listeners.add(listener);
    },
    removeEventListener: (_type: string, listener: () => void) => {
      listeners.delete(listener);
    },
  }));
  return {
    set: (matches) => {
      current = matches;
      listeners.forEach((listener) => {
        listener();
      });
    },
  };
}
