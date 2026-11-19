import type { ComplexityTest } from '@/domain';
import { timeBudget } from '@/domain';
import { budgetOf, measureComplexity } from './complexity';
import type { ReferenceTiming } from './complexity';

const anyNumber = expect.any(Number) as number;

const sumLinear =
  'function sum(xs) { let t = 0; for (let i = 0; i < xs.length; i++) t += xs[i]; return t; }';
const sumQuadratic = `function sum(xs) {
  let t = 0;
  for (let i = 0; i < xs.length; i++) {
    for (let j = 0; j < xs.length; j++) if (i === j) t += xs[i];
  }
  return t;
}`;
const sumWrong = 'function sum(xs) { return -1; }';

const test: ComplexityTest = {
  id: 'big',
  generator: { kind: 'range', size: 20000 },
  expected: 'reference',
  budgetMultiple: 5,
  complexity: 'O(n)',
};

const measure = (learnerCode: string, complexityTest: ComplexityTest = test) =>
  measureComplexity({
    learnerCode,
    referenceCode: sumLinear,
    functionName: 'sum',
    test: complexityTest,
  });

const reverseQuadratic = `function reverseList(head) {
  const values = [];
  for (let node = head; node !== null; node = node.next) values.push(node.val);
  let result = null;
  let tail = null;
  while (values.length > 0) {
    const node = new ListNode(values.pop());
    if (tail === null) result = node; else tail.next = node;
    tail = result;
    while (tail.next !== null) tail = tail.next;
  }
  return result;
}`;
const reverseLinear = `function reverseList(head) {
  let previous = null;
  let current = head;
  while (current !== null) {
    const next = current.next;
    current.next = previous;
    previous = current;
    current = next;
  }
  return previous;
}`;

describe('measureComplexity', () => {
  it('passes a linear learner against a linear reference', () => {
    expect(measure(sumLinear)).toEqual({
      ok: true,
      value: { kind: 'passed', testId: 'big', durationMs: anyNumber },
    });
  });

  it('reports too-slow for a quadratic learner on 20000 elements', () => {
    expect(measure(sumQuadratic)).toEqual({
      ok: true,
      value: {
        kind: 'too-slow',
        testId: 'big',
        durationMs: anyNumber,
        budgetMs: 50,
        complexity: 'O(n)',
      },
    });
  });

  it('fails when the output differs from the reference', () => {
    expect(measure(sumWrong, { ...test, generator: { kind: 'range', size: 3 } })).toEqual({
      ok: true,
      value: {
        kind: 'failed',
        testId: 'big',
        args: [{ shape: 'value', value: [0, 1, 2] }],
        expected: { shape: 'value', value: 3 },
        actual: { shape: 'value', value: -1 },
      },
    });
  });

  it('errors when the learner throws', () => {
    expect(measure('function sum() { throw new Error("no"); }')).toEqual({
      ok: true,
      value: { kind: 'errored', testId: 'big', message: 'no' },
    });
  });

  it('reports a Reference that throws as an error value, not a learner outcome', () => {
    expect(
      measureComplexity({
        learnerCode: sumLinear,
        referenceCode: 'function sum() { throw new Error("broken"); }',
        functionName: 'sum',
        test,
      }),
    ).toEqual({ ok: false, error: 'Reference: broken' });
  });

  it('reports a Reference that is missing as an error value', () => {
    expect(
      measureComplexity({
        learnerCode: sumLinear,
        referenceCode: 'const x = 1;',
        functionName: 'sum',
        test,
      }),
    ).toEqual({ ok: false, error: 'Reference: Function sum is not defined' });
  });

  it('times the reference and announces its budget before the learner starts', () => {
    const order: string[] = [];
    const timings: ReferenceTiming[] = [];
    Reflect.set(globalThis, '__log', (name: string) => order.push(name));
    const logging = (name: string) =>
      `const log = globalThis.__log;\nfunction sum(xs) { log("${name}"); return xs.length; }`;
    measureComplexity({
      learnerCode: logging('learner'),
      referenceCode: logging('reference'),
      functionName: 'sum',
      test: { ...test, generator: { kind: 'range', size: 3 } },
      onReferenceTimed: (timing) => {
        order.push('timed');
        timings.push(timing);
      },
    });
    expect({ order, timings }).toEqual({
      order: ['reference', 'timed', 'learner'],
      timings: [{ ms: anyNumber, budgetMs: 50 }],
    });
  });

  it('feeds linked-list-range inputs as node chains', () => {
    const code =
      'function len(head) { let n = 0; for (let c = head; c; c = c.next) n++; return n; }';
    expect(
      measureComplexity({
        learnerCode: code,
        referenceCode: code,
        functionName: 'len',
        test: { ...test, generator: { kind: 'linked-list-range', size: 50 } },
      }),
    ).toEqual({ ok: true, value: { kind: 'passed', testId: 'big', durationMs: anyNumber } });
  });

  it('announces the budget for reverseList at 100000 nodes before the quadratic learner would run', () => {
    class Stop extends Error {}
    const reverseTest: ComplexityTest = {
      id: 'long',
      generator: { kind: 'linked-list-range', size: 100000 },
      expected: 'reference',
      budgetMultiple: 8,
      complexity: 'O(n)',
    };
    const timings: ReferenceTiming[] = [];
    const attempt = () =>
      measureComplexity({
        learnerCode: reverseQuadratic,
        referenceCode: reverseLinear,
        functionName: 'reverseList',
        test: reverseTest,
        onReferenceTimed: (timing) => {
          timings.push(timing);
          throw new Stop('learner not started');
        },
      });
    expect(attempt).toThrow('learner not started');
    const ms = timings[0]?.ms ?? 0;
    expect(timings).toEqual([{ ms, budgetMs: timeBudget(ms, 8) }]);
  });

  it('derives the budget exactly as the domain Time Budget does', () => {
    expect([0, 0.2, 7, 50].map((ms) => budgetOf(ms, 8))).toEqual(
      [0, 0.2, 7, 50].map((ms) => timeBudget(ms, 8)),
    );
  });
});
