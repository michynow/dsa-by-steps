import type { Exercise, RunReport } from '@/domain';
import { createWorkerExerciseRunner } from './worker-runner';
import type { WorkerLike } from './types';

const exercise: Exercise = {
  functionName: 'f',
  starterCode: '',
  referenceSolution: 'function f() {}',
  visibleTests: [],
  hiddenTests: [],
  hintCount: 0,
};

const report: RunReport = {
  mode: 'run',
  passed: true,
  outcomes: [{ kind: 'passed', testId: 'a', durationMs: 1 }],
};

interface FakeWorker extends WorkerLike {
  readonly posted: unknown[];
  terminated: number;
  reply(data: unknown): void;
}

function fakeWorker(): FakeWorker {
  const worker: FakeWorker = {
    posted: [],
    terminated: 0,
    onmessage: null,
    postMessage(message) {
      worker.posted.push(message);
    },
    terminate() {
      worker.terminated += 1;
    },
    reply(data) {
      worker.onmessage?.(new MessageEvent('message', { data }));
    },
  };
  return worker;
}

function setup(limitMs?: number) {
  const workers: FakeWorker[] = [];
  const createWorker = () => {
    const worker = fakeWorker();
    workers.push(worker);
    return worker;
  };
  const runner = createWorkerExerciseRunner(
    limitMs === undefined ? { createWorker } : { createWorker, limitMs },
  );
  return { workers, runner };
}

afterEach(() => {
  vi.useRealTimers();
});

describe('createWorkerExerciseRunner', () => {
  it('posts a versioned run request and resolves with the report', async () => {
    const { workers, runner } = setup();
    const result = runner.run(exercise, 'code', 'run');
    expect(workers[0]?.posted).toEqual([
      {
        version: 1,
        type: 'run',
        mode: 'run',
        exercise: {
          functionName: 'f',
          visibleTests: [],
          hiddenTests: [],
          referenceSolution: 'function f() {}',
        },
        code: 'code',
      },
    ]);
    workers[0]?.reply({ version: 1, type: 'report', report });
    await expect(result).resolves.toEqual({ kind: 'report', report });
  });

  it('uses a fresh worker for every call and terminates each on completion', async () => {
    const { workers, runner } = setup();
    const first = runner.run(exercise, 'a', 'run');
    workers[0]?.reply({ version: 1, type: 'report', report });
    await first;
    const second = runner.run(exercise, 'b', 'submit');
    workers[1]?.reply({ version: 1, type: 'report', report });
    await second;
    expect(workers.map((w) => w.terminated)).toEqual([1, 1]);
    expect(workers).toHaveLength(2);
  });

  it('passes a compile error through and terminates the worker', async () => {
    const { workers, runner } = setup();
    const result = runner.run(exercise, 'x', 'run');
    const error = { message: 'bad', line: 1, column: 2 };
    workers[0]?.reply({ version: 1, type: 'compile-error', error });
    await expect(result).resolves.toEqual({ kind: 'compile-error', error });
    expect(workers[0]?.terminated).toBe(1);
  });

  it('times out an unresponsive worker after the limit and terminates it', async () => {
    vi.useFakeTimers();
    const { workers, runner } = setup(300);
    const result = runner.run(exercise, 'while(true){}', 'run');
    await vi.advanceTimersByTimeAsync(299);
    expect(workers[0]?.terminated).toBe(0);
    await vi.advanceTimersByTimeAsync(1);
    await expect(result).resolves.toEqual({ kind: 'timed-out', limitMs: 300 });
    expect(workers[0]?.terminated).toBe(1);
  });

  it('defaults the limit to 5000 ms', async () => {
    vi.useFakeTimers();
    const { runner } = setup();
    const result = runner.run(exercise, 'x', 'run');
    await vi.advanceTimersByTimeAsync(5000);
    await expect(result).resolves.toEqual({ kind: 'timed-out', limitMs: 5000 });
  });

  it('does not time out after a reply arrived', async () => {
    vi.useFakeTimers();
    const { workers, runner } = setup(300);
    const result = runner.run(exercise, 'x', 'run');
    workers[0]?.reply({ version: 1, type: 'report', report });
    await vi.advanceTimersByTimeAsync(1000);
    await expect(result).resolves.toEqual({ kind: 'report', report });
    expect(workers[0]?.terminated).toBe(1);
  });

  it('rejects and terminates when the worker sends a malformed message', async () => {
    const { workers, runner } = setup();
    const result = runner.run(exercise, 'x', 'run');
    workers[0]?.reply({ version: 1, type: 'report', report: 5 });
    await expect(result).rejects.toThrow('report: Invalid input: expected object, received number');
    expect(workers[0]?.terminated).toBe(1);
  });
});
