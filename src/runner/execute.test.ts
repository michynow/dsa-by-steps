import type { JsonValue, ShapedValue, TestCase } from '@/domain';
import { executeTests } from './execute';

const value = (v: JsonValue): ShapedValue => ({ shape: 'value', value: v });
const list = (v: JsonValue): ShapedValue => ({ shape: 'linked-list', value: v });
const testCase = (id: string, args: readonly ShapedValue[], expected: ShapedValue): TestCase => ({
  id,
  args,
  expected,
});

const run = (code: string, tests: readonly TestCase[], functionName = 'f') =>
  executeTests({ code, functionName, tests });

const anyNumber = expect.any(Number) as number;

describe('executeTests', () => {
  it('passes a correct function and records the duration', () => {
    const [outcome] = run('function f(a, b) { return a + b; }', [
      testCase('sum', [value(1), value(2)], value(3)),
    ]);
    expect(outcome).toEqual({ kind: 'passed', testId: 'sum', durationMs: anyNumber });
    expect(outcome?.kind === 'passed' && outcome.durationMs).toBeGreaterThanOrEqual(0);
  });

  it('fails with args, expected and actual as shaped values', () => {
    expect(run('function f(a) { return a + 1; }', [testCase('inc', [value(1)], value(5))])).toEqual(
      [{ kind: 'failed', testId: 'inc', args: [value(1)], expected: value(5), actual: value(2) }],
    );
  });

  it('transpiled-away types are not needed: code is plain JavaScript', () => {
    expect(
      run('const f = (a) => a;', [testCase('id', [value('x')], value('x'))]).map((o) => o.kind),
    ).toEqual(['passed']);
  });

  it('errors when the function throws', () => {
    expect(run('function f() { throw new Error("boom"); }', [testCase('t', [], value(1))])).toEqual(
      [{ kind: 'errored', testId: 't', message: 'boom' }],
    );
  });

  it('errors when the function is missing', () => {
    expect(run('const other = 1;', [testCase('t', [], value(1))])).toEqual([
      { kind: 'errored', testId: 't', message: 'Function f is not defined' },
    ]);
  });

  it('errors when the code itself throws while loading', () => {
    expect(run('throw new Error("load");', [testCase('t', [], value(1))])).toEqual([
      { kind: 'errored', testId: 't', message: 'load' },
    ]);
  });

  it('errors when the result is not representable', () => {
    expect(run('function f() {}', [testCase('t', [], value(1))])).toEqual([
      { kind: 'errored', testId: 't', message: 'Returned a value that is not JSON' },
    ]);
  });

  it('compares nested arrays and objects deeply and order-sensitively', () => {
    const code = 'function f(x) { return x; }';
    const nested = { a: [1, { b: [2, 3] }], c: null };
    expect(
      run(code, [
        testCase('same', [value(nested)], value({ c: null, a: [1, { b: [2, 3] }] })),
        testCase('order', [value([1, 2])], value([2, 1])),
        testCase('deep', [value(nested)], value({ a: [1, { b: [2, 4] }], c: null })),
      ]).map((o) => o.kind),
    ).toEqual(['passed', 'failed', 'failed']);
  });

  it('does not let a function mutate the next test through shared args', () => {
    const outcomes = run('function f(x) { x.push(9); return x.length; }', [
      testCase('first', [value([1])], value(2)),
      testCase('second', [value([1])], value(2)),
    ]);
    expect(outcomes.map((o) => o.kind)).toEqual(['passed', 'passed']);
  });

  it('converts linked-list arguments to node chains and results back', () => {
    const code = `function f(head) {
      const out = [];
      for (let n = head; n !== null; n = n.next) out.push(n.val);
      return out;
    }`;
    expect(
      run(code, [
        testCase('three', [list([1, 2, 3])], value([1, 2, 3])),
        testCase('null', [list(null)], value([])),
        testCase('empty', [list([])], value([])),
      ]).map((o) => o.kind),
    ).toEqual(['passed', 'passed', 'passed']);
  });

  it('converts a returned node chain back to an array including the last node', () => {
    const code = 'function f(head) { return head; }';
    expect(
      run(code, [
        testCase('three', [list([1, 2, 3])], list([1, 2, 3])),
        testCase('single', [list([7])], list([7])),
        testCase('empty', [list([])], list([])),
        testCase('null', [list(null)], list([])),
      ]).map((o) => o.kind),
    ).toEqual(['passed', 'passed', 'passed', 'passed']);
  });

  it('reports a failing list result as an array', () => {
    expect(
      run('function f(head) { return head.next; }', [
        testCase('t', [list([1, 2, 3])], list([1, 2, 3])),
      ]),
    ).toEqual([
      {
        kind: 'failed',
        testId: 't',
        args: [list([1, 2, 3])],
        expected: list([1, 2, 3]),
        actual: list([2, 3]),
      },
    ]);
  });

  it('builds nodes with the ListNode helper', () => {
    const code = 'function f() { return new ListNode(1, new ListNode(2)); }';
    expect(run(code, [testCase('t', [], list([1, 2]))]).map((o) => o.kind)).toEqual(['passed']);
  });

  it('errors on a cyclic list result', () => {
    const code = 'function f(head) { head.next.next = head; return head; }';
    expect(run(code, [testCase('t', [list([1, 2])], list([1, 2]))])).toEqual([
      { kind: 'errored', testId: 't', message: 'Returned list contains a cycle' },
    ]);
  });

  it('errors on a returned list longer than 100000 nodes', () => {
    const code = `function f() {
      let head = null;
      for (let i = 0; i < 100001; i++) head = new ListNode(i, head);
      return head;
    }`;
    expect(run(code, [testCase('t', [], list([]))])).toEqual([
      { kind: 'errored', testId: 't', message: 'Returned list is longer than 100000 nodes' },
    ]);
  });

  it('accepts a list of exactly 100000 nodes', () => {
    const code = `function f() {
      let head = null;
      for (let i = 0; i < 100000; i++) head = new ListNode(0, head);
      return head;
    }`;
    expect(
      run(code, [testCase('t', [], list(Array.from({ length: 100000 }, () => 0)))]).map(
        (o) => o.kind,
      ),
    ).toEqual(['passed']);
  });

  it('errors when a list shape result is not a list', () => {
    expect(run('function f() { return 5; }', [testCase('t', [], list([1]))])).toEqual([
      { kind: 'errored', testId: 't', message: 'Returned a value that is not a linked list' },
    ]);
  });
});
