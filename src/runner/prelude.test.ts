import type { Exercise } from '@/domain';
import { preludeFor } from './prelude';
import { transpile } from './transpile';

const base: Exercise = {
  functionName: 'f',
  starterCode: '',
  referenceSolution: '',
  visibleTests: [],
  hiddenTests: [],
  hintCount: 0,
};

const listTest = (v: number[]) => ({
  id: 't',
  args: [{ shape: 'linked-list' as const, value: v }],
  expected: { shape: 'linked-list' as const, value: v },
});

describe('preludeFor', () => {
  it('is empty when no shape needs a helper', () => {
    expect(preludeFor(base)).toBe('');
  });

  it('declares ListNode typed by the list values', () => {
    expect(preludeFor({ ...base, visibleTests: [listTest([1, 2])] })).toBe(
      'class ListNode {\n  val: number;\n  next: ListNode | null;\n  constructor(val: number, next: ListNode | null = null) {\n    this.val = val;\n    this.next = next;\n  }\n}\n',
    );
  });

  it('types string lists as string and falls back to number for empty ones', () => {
    const stringList = {
      id: 't',
      args: [{ shape: 'linked-list' as const, value: ['a'] }],
      expected: { shape: 'linked-list' as const, value: ['a'] },
    };
    expect(preludeFor({ ...base, hiddenTests: [stringList] })).toContain('val: string;');
    expect(preludeFor({ ...base, visibleTests: [listTest([])] })).toContain('val: number;');
  });

  it('declares ListNode for a linked-list complexity generator', () => {
    expect(
      preludeFor({
        ...base,
        complexityTest: {
          id: 'c',
          generator: { kind: 'linked-list-range', size: 5 },
          expected: 'reference',
          budgetMultiple: 5,
          complexity: 'O(n)',
        },
      }),
    ).toContain('class ListNode');
  });

  it('is valid TypeScript that transpiles', async () => {
    expect((await transpile(preludeFor({ ...base, visibleTests: [listTest([1])] }))).ok).toBe(true);
  });
});
