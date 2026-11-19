import type { ComplexityTest, Exercise, TestCase, TestOutcome } from '@/domain';
import { transpile } from './transpile';
import type { WorkerLike } from './types';
import { createWorkerExerciseRunner } from './worker-runner';
import type { WorkerRunnerOptions } from './worker-runner';

const testCase = (id: string): TestCase => ({
  id,
  args: [],
  expected: { shape: 'value', value: 1 },
});

const complexityTest: ComplexityTest = {
  id: 'big',
  generator: { kind: 'range', size: 10 },
  expected: 'reference',
  budgetMultiple: 5,
  complexity: 'O(n)',
};

const exercise: Exercise = {
  functionName: 'f',
  starterCode: '',
  referenceSolution: 'function f(): number { return 1; }',
  visibleTests: [testCase('t1'), testCase('t2'), testCase('t3')],
  hiddenTests: [testCase('h1')],
  complexityTest,
  hintCount: 0,
};

const passed = (testId: string): TestOutcome => ({ kind: 'passed', testId, durationMs: 1 });

interface FakeWorker extends WorkerLike {
  readonly posted: Record<string, unknown>[];
  terminated: number;
  nonce(): string;
  send(message: Record<string, unknown>): void;
  sendForged(message: unknown): void;
  crash(message: string): void;
}

function fakeWorker(): FakeWorker {
  const worker: FakeWorker = {
    posted: [],
    terminated: 0,
    onmessage: null,
    onerror: null,
    postMessage(message) {
      worker.posted.push(Object.fromEntries(Object.entries(message as object)));
    },
    terminate() {
      worker.terminated += 1;
    },
    nonce() {
      return String(worker.posted[0]?.['nonce']);
    },
    send(message) {
      worker.sendForged({ version: 1, nonce: worker.nonce(), ...message });
    },
    sendForged(message) {
      worker.onmessage?.(new MessageEvent('message', { data: message }));
    },
    crash(message) {
      worker.onerror?.(new ErrorEvent('error', { message }));
    },
  };
  return worker;
}

function setup(options: WorkerRunnerOptions = {}) {
  const workers: FakeWorker[] = [];
  let counter = 0;
  const runner = createWorkerExerciseRunner({
    createWorker: () => {
      const worker = fakeWorker();
      workers.push(worker);
      return worker;
    },
    createNonce: () => `nonce-${String((counter += 1))}`,
    ...options,
  });
  return { workers, runner };
}

async function workerAt(workers: readonly FakeWorker[], index: number): Promise<FakeWorker> {
  await vi.advanceTimersByTimeAsync(0);
  const worker = workers[index];
  if (worker === undefined) throw new Error(`worker ${String(index)} was not created`);
  return worker;
}

function streamTests(worker: FakeWorker, ids: readonly string[]): void {
  for (const id of ids) {
    worker.send({ type: 'test-started', testId: id });
    worker.send({ type: 'outcome', outcome: passed(id) });
  }
  worker.send({ type: 'done' });
}

beforeAll(async () => {
  await transpile('const warm = 1;');
});

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('createWorkerExerciseRunner correctness phase', () => {
  it('posts transpiled code with a nonce and returns the streamed report', async () => {
    const { workers, runner } = setup();
    const result = runner.run(exercise, 'function f(): number { return 1; }', 'run');
    const worker = await workerAt(workers, 0);
    expect(worker.posted).toEqual([
      {
        version: 1,
        nonce: 'nonce-1',
        type: 'run-tests',
        functionName: 'f',
        code: '"use strict";\nfunction f() { return 1; }\n',
        tests: exercise.visibleTests,
      },
    ]);
    streamTests(worker, ['t1', 't2', 't3']);
    await expect(result).resolves.toEqual({
      kind: 'report',
      report: { mode: 'run', passed: true, outcomes: ['t1', 't2', 't3'].map(passed) },
    });
    expect(workers).toHaveLength(1);
  });

  it('uses a fresh worker with a fresh nonce for every call and terminates each', async () => {
    const { workers, runner } = setup();
    const first = runner.run(exercise, 'function f() {}', 'run');
    streamTests(await workerAt(workers, 0), ['t1', 't2', 't3']);
    await first;
    const second = runner.run(exercise, 'function f() {}', 'run');
    streamTests(await workerAt(workers, 1), ['t1', 't2', 't3']);
    await second;
    expect({
      count: workers.length,
      terminated: workers.map((w) => w.terminated),
      nonces: workers.map((w) => w.nonce()),
    }).toEqual({ count: 2, terminated: [1, 1], nonces: ['nonce-1', 'nonce-2'] });
  });

  it('returns a compile error without creating a worker', async () => {
    const { workers, runner } = setup();
    await expect(runner.run(exercise, 'const = ;', 'run')).resolves.toEqual({
      kind: 'compile-error',
      error: { message: 'Variable declaration expected.', line: 1, column: 7 },
    });
    expect(workers).toHaveLength(0);
  });

  it('keeps earlier outcomes, times out the hanging test and skips the rest', async () => {
    const { workers, runner } = setup({ testLimitMs: 2000 });
    const result = runner.run(exercise, 'function f() {}', 'run');
    const worker = await workerAt(workers, 0);
    worker.send({ type: 'test-started', testId: 't1' });
    worker.send({ type: 'outcome', outcome: passed('t1') });
    worker.send({ type: 'test-started', testId: 't2' });
    await vi.advanceTimersByTimeAsync(2000);
    await expect(result).resolves.toEqual({
      kind: 'report',
      report: {
        mode: 'run',
        passed: false,
        outcomes: [
          passed('t1'),
          { kind: 'timed-out', testId: 't2', limitMs: 2000 },
          { kind: 'skipped', testId: 't3' },
        ],
      },
    });
    expect(worker.terminated).toBe(1);
  });

  it('defaults the per-test limit to 2000 ms and restarts it on every message', async () => {
    const { workers, runner } = setup();
    const result = runner.run(exercise, 'function f() {}', 'run');
    const worker = await workerAt(workers, 0);
    await vi.advanceTimersByTimeAsync(1999);
    worker.send({ type: 'test-started', testId: 't1' });
    await vi.advanceTimersByTimeAsync(1999);
    expect(worker.terminated).toBe(0);
    await vi.advanceTimersByTimeAsync(1);
    await expect(result).resolves.toEqual({
      kind: 'report',
      report: {
        mode: 'run',
        passed: false,
        outcomes: [
          { kind: 'timed-out', testId: 't1', limitMs: 2000 },
          { kind: 'skipped', testId: 't2' },
          { kind: 'skipped', testId: 't3' },
        ],
      },
    });
  });

  it('ignores messages with a wrong nonce, malformed messages and foreign test ids', async () => {
    const { workers, runner } = setup();
    const result = runner.run(exercise, 'function f() {}', 'run');
    const worker = await workerAt(workers, 0);
    worker.sendForged({ version: 1, nonce: 'guess', type: 'outcome', outcome: passed('t1') });
    worker.sendForged({ version: 1, nonce: 'guess', type: 'done' });
    worker.sendForged('garbage');
    worker.send({ type: 'outcome', outcome: passed('not-in-request') });
    worker.send({ type: 'done' });
    await expect(result).resolves.toEqual({
      kind: 'report',
      report: {
        mode: 'run',
        passed: false,
        outcomes: ['t1', 't2', 't3'].map((testId) => ({ kind: 'skipped', testId })),
      },
    });
  });

  it('recomputes passed from the outcomes it received', async () => {
    const { workers, runner } = setup();
    const result = runner.run(exercise, 'function f() {}', 'run');
    const worker = await workerAt(workers, 0);
    worker.send({ type: 'outcome', outcome: passed('t1') });
    worker.send({ type: 'done' });
    await expect(result).resolves.toEqual({
      kind: 'report',
      report: {
        mode: 'run',
        passed: false,
        outcomes: [
          passed('t1'),
          { kind: 'skipped', testId: 't2' },
          { kind: 'skipped', testId: 't3' },
        ],
      },
    });
  });

  it('reports an internal error as soon as the worker errors', async () => {
    const { workers, runner } = setup();
    const result = runner.run(exercise, 'function f() {}', 'run');
    const worker = await workerAt(workers, 0);
    worker.crash('boom');
    await expect(result).resolves.toEqual({ kind: 'internal-error', message: 'boom' });
    expect(worker.terminated).toBe(1);
  });

  it('reports an internal error when the Reference Solution does not compile', async () => {
    const { workers, runner } = setup();
    const broken: Exercise = { ...exercise, referenceSolution: 'const = ;' };
    await expect(runner.run(broken, 'function f() {}', 'run')).resolves.toEqual({
      kind: 'internal-error',
      message: 'Reference Solution does not compile: Variable declaration expected.',
    });
    expect(workers).toHaveLength(0);
  });
});

describe('createWorkerExerciseRunner complexity phase', () => {
  const submitCorrectness = async (workers: FakeWorker[]) => {
    const first = await workerAt(workers, 0);
    expect(first.posted[0]?.['tests']).toEqual([...exercise.visibleTests, ...exercise.hiddenTests]);
    streamTests(first, ['t1', 't2', 't3', 'h1']);
    await vi.advanceTimersByTimeAsync(0);
    return workerAt(workers, 1);
  };

  it('runs the Complexity Test in its own fresh worker after the correctness phase', async () => {
    const { workers, runner } = setup();
    const result = runner.run(exercise, 'function f(): number { return 1; }', 'submit');
    const complexity = await submitCorrectness(workers);
    expect(complexity.posted).toEqual([
      {
        version: 1,
        nonce: 'nonce-2',
        type: 'run-complexity',
        functionName: 'f',
        learnerCode: '"use strict";\nfunction f() { return 1; }\n',
        referenceCode: '"use strict";\nfunction f() { return 1; }\n',
        test: complexityTest,
      },
    ]);
    complexity.send({ type: 'reference-timed', ms: 1, budgetMs: 50 });
    complexity.send({ type: 'outcome', outcome: passed('big') });
    complexity.send({ type: 'done' });
    await expect(result).resolves.toEqual({
      kind: 'report',
      report: {
        mode: 'submit',
        passed: true,
        outcomes: ['t1', 't2', 't3', 'h1', 'big'].map(passed),
      },
    });
    expect(workers.map((w) => w.terminated)).toEqual([1, 1]);
  });

  it('records too-slow when the budget plus grace elapses', async () => {
    const { workers, runner } = setup({ graceMs: 500 });
    const result = runner.run(exercise, 'function f() {}', 'submit');
    const complexity = await submitCorrectness(workers);
    complexity.send({ type: 'reference-timed', ms: 1, budgetMs: 80 });
    await vi.advanceTimersByTimeAsync(579);
    expect(complexity.terminated).toBe(0);
    await vi.advanceTimersByTimeAsync(1);
    await expect(result).resolves.toEqual({
      kind: 'report',
      report: {
        mode: 'submit',
        passed: false,
        outcomes: [
          ...['t1', 't2', 't3', 'h1'].map(passed),
          { kind: 'too-slow', testId: 'big', durationMs: 580, budgetMs: 80, complexity: 'O(n)' },
        ],
      },
    });
    expect(complexity.terminated).toBe(1);
  });

  it('skips the Complexity Test when a correctness test did not pass', async () => {
    const { workers, runner } = setup();
    const result = runner.run(exercise, 'function f() {}', 'submit');
    const worker = await workerAt(workers, 0);
    worker.send({ type: 'outcome', outcome: passed('t1') });
    worker.send({ type: 'done' });
    await expect(result).resolves.toEqual({
      kind: 'report',
      report: {
        mode: 'submit',
        passed: false,
        outcomes: [
          passed('t1'),
          ...['t2', 't3', 'h1', 'big'].map((testId) => ({ kind: 'skipped', testId })),
        ],
      },
    });
    expect(workers).toHaveLength(1);
  });

  it('reports an internal error when the Reference fails in the worker', async () => {
    const { workers, runner } = setup();
    const result = runner.run(exercise, 'function f() {}', 'submit');
    const complexity = await submitCorrectness(workers);
    complexity.send({ type: 'internal-error', message: 'Reference: broken' });
    await expect(result).resolves.toEqual({ kind: 'internal-error', message: 'Reference: broken' });
    expect(complexity.terminated).toBe(1);
  });

  it('reports an internal error when the Reference never reports its timing', async () => {
    const { workers, runner } = setup();
    const result = runner.run(exercise, 'function f() {}', 'submit');
    const complexity = await submitCorrectness(workers);
    await vi.advanceTimersByTimeAsync(2000);
    await expect(result).resolves.toEqual({
      kind: 'internal-error',
      message: 'Reference Solution did not finish in time',
    });
    expect(complexity.terminated).toBe(1);
  });
});
