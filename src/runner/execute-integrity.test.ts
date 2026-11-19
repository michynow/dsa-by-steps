import type { JsonValue, ShapedValue, TestCase } from '@/domain';
import { executeTests } from './execute';

const value = (v: JsonValue): ShapedValue => ({ shape: 'value', value: v });
const list = (v: JsonValue): ShapedValue => ({ shape: 'linked-list', value: v });
const testCase = (id: string, args: readonly ShapedValue[], expected: ShapedValue): TestCase => ({
  id,
  args,
  expected,
});

const run = (code: string, tests: readonly TestCase[]) =>
  executeTests({ code, functionName: 'f', tests });

const originals = {
  entries: Object.entries,
  keys: Object.keys,
  getPrototypeOf: Object.getPrototypeOf,
  isArray: Array.isArray,
  isFinite: Number.isFinite,
  stringify: JSON.stringify,
  now: performance.now.bind(performance),
  clone: structuredClone,
  apply: Reflect.apply,
  map: Map,
};

afterEach(() => {
  Object.assign(Object, {
    entries: originals.entries,
    keys: originals.keys,
    getPrototypeOf: originals.getPrototypeOf,
  });
  Array.isArray = originals.isArray;
  Number.isFinite = originals.isFinite;
  JSON.stringify = originals.stringify;
  performance.now = originals.now;
  globalThis.structuredClone = originals.clone;
  Reflect.apply = originals.apply;
  globalThis.Map = originals.map;
});

describe('executeTests judge integrity', () => {
  it('errors with a stable reason on a stack overflow', () => {
    expect(
      run('function f(n) { return f(n + 1) + 1; }', [testCase('deep', [value(0)], value(1))]),
    ).toEqual([
      {
        kind: 'errored',
        testId: 'deep',
        message: 'Maximum call stack size exceeded',
        reason: 'stack-overflow',
      },
    ]);
  });

  it('does not set a reason on ordinary errors', () => {
    expect(
      run('function f() { throw new RangeError("other"); }', [testCase('t', [], value(1))]),
    ).toEqual([{ kind: 'errored', testId: 't', message: 'other' }]);
  });

  it('compares objects with extra or missing keys as different', () => {
    expect(
      run('function f(x) { return x; }', [
        testCase('extra', [value({ a: 1, b: 2 })], value({ a: 1 })),
        testCase('missing', [value({ a: 1 })], value({ a: 1, b: 2 })),
        testCase('renamed', [value({ a: 1 })], value({ b: 1 })),
        testCase('array-vs-object', [value([])], value({})),
      ]).map((o) => o.kind),
    ).toEqual(['failed', 'failed', 'failed', 'failed']);
  });

  it('gives every test fresh linked-list arguments', () => {
    const code = 'function f(head) { head.val = 99; head.next = null; return head.val; }';
    expect(
      run(code, [
        testCase('first', [list([1, 2, 3])], value(99)),
        testCase('second', [list([1, 2, 3])], value(99)),
      ]).map((o) => o.kind),
    ).toEqual(['passed', 'passed']);
  });

  it('still fails a wrong answer when the code overwrites the built-ins the judge uses', () => {
    const sabotage = `
      Object.entries = () => [];
      Object.keys = () => [];
      Object.getPrototypeOf = () => Object.prototype;
      Array.isArray = () => true;
      Number.isFinite = () => true;
      JSON.stringify = () => '';
      globalThis.structuredClone = () => null;
      Reflect.apply = () => 1;
      globalThis.Map = class {};
      function f() { return { a: 1 }; }
    `;
    expect(run(sabotage, [testCase('wrong', [], value({ a: 2 }))]).map((o) => o.kind)).toEqual([
      'failed',
    ]);
  });

  it('keeps timing when the code overwrites performance.now', () => {
    const code = `
      performance.now = () => 0;
      function f() { const end = Date.now() + 20; while (Date.now() < end); return 1; }
    `;
    const [outcome] = run(code, [testCase('slow', [], value(1))]);
    expect(outcome?.kind === 'passed' && outcome.durationMs).toBeGreaterThanOrEqual(15);
  });

  it('times result materialisation, not only the call', () => {
    const code = `function f() {
      return { get a() { const end = Date.now() + 30; while (Date.now() < end); return 1; } };
    }`;
    const [outcome] = run(code, [testCase('getter', [], value({ a: 1 }))]);
    expect(outcome?.kind === 'passed' && outcome.durationMs).toBeGreaterThanOrEqual(25);
  });
});
