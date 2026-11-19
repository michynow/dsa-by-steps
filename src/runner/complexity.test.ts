import type { ComplexityTest } from '@/domain';
import { measureComplexity } from './complexity';

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

const anyNumber = expect.any(Number) as number;

describe('measureComplexity', () => {
  it('passes a linear learner against a linear reference', () => {
    expect(measure(sumLinear)).toEqual({
      kind: 'passed',
      testId: 'big',
      durationMs: anyNumber,
    });
  });

  it('reports too-slow for a quadratic learner on 20000 elements', () => {
    expect(measure(sumQuadratic)).toEqual({
      kind: 'too-slow',
      testId: 'big',
      durationMs: anyNumber,
      budgetMs: anyNumber,
      complexity: 'O(n)',
    });
    const outcome = measure(sumQuadratic);
    expect(outcome.kind === 'too-slow' && outcome.durationMs > outcome.budgetMs).toBe(true);
  });

  it('derives the budget from the reference time and the floor', () => {
    const outcome = measure(sumQuadratic);
    expect(outcome.kind === 'too-slow' && outcome.budgetMs).toBe(50);
  });

  it('fails when the output differs from the reference', () => {
    expect(measure(sumWrong, { ...test, generator: { kind: 'range', size: 3 } })).toEqual({
      kind: 'failed',
      testId: 'big',
      args: [{ shape: 'value', value: [0, 1, 2] }],
      expected: { shape: 'value', value: 3 },
      actual: { shape: 'value', value: -1 },
    });
  });

  it('errors when the learner throws', () => {
    expect(measure('function sum() { throw new Error("no"); }')).toEqual({
      kind: 'errored',
      testId: 'big',
      message: 'no',
    });
  });

  it('times the reference before the learner on the same input', () => {
    const order: string[] = [];
    const reference = 'function sum(xs) { log("reference"); return xs.length; }';
    const learner = 'function sum(xs) { log("learner"); return xs.length; }';
    const withLog = (code: string) => `const log = globalThis.__log;\n${code}`;
    Reflect.set(globalThis, '__log', (name: string) => order.push(name));
    measureComplexity({
      learnerCode: withLog(learner),
      referenceCode: withLog(reference),
      functionName: 'sum',
      test: { ...test, generator: { kind: 'range', size: 3 } },
    });
    expect(order).toEqual(['reference', 'learner']);
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
      }).kind,
    ).toBe('passed');
  });
});
