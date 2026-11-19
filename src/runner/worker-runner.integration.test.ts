import type { ComplexityTest, Exercise } from '@/domain';
import { handleRunRequest } from './handle-run-request';
import type { WorkerLike } from './types';
import { createWorkerExerciseRunner } from './worker-runner';

const anyNumber = expect.any(Number) as number;

const complexityTest: ComplexityTest = {
  id: 'big',
  generator: { kind: 'range', size: 20000 },
  expected: 'reference',
  budgetMultiple: 5,
  complexity: 'O(n)',
};

const exercise: Exercise = {
  functionName: 'sum',
  starterCode: '',
  referenceSolution:
    'function sum(xs: number[]): number { let t = 0; for (const x of xs) t += x; return t; }',
  visibleTests: [
    {
      id: 'small',
      args: [{ shape: 'value', value: [1, 2, 3] }],
      expected: { shape: 'value', value: 6 },
    },
  ],
  hiddenTests: [],
  complexityTest,
  hintCount: 0,
};

function loopbackWorker(): WorkerLike {
  const worker: WorkerLike = {
    onmessage: null,
    onerror: null,
    terminate: () => undefined,
    postMessage: (request) => {
      const result = handleRunRequest(request, (response) => {
        worker.onmessage?.(new MessageEvent('message', { data: response }));
      });
      if (!result.ok) worker.onerror?.(new ErrorEvent('error', { message: result.error }));
    },
  };
  Reflect.set(globalThis, '__forge', (data: unknown) => {
    worker.onmessage?.(new MessageEvent('message', { data }));
  });
  return worker;
}

const runner = createWorkerExerciseRunner({ createWorker: loopbackWorker });

describe('worker runner end to end with a loopback worker', () => {
  it('passes a correct Submit including the Complexity Test', async () => {
    const result = await runner.run(
      exercise,
      'function sum(xs: number[]): number { return xs.reduce((a, b) => a + b, 0); }',
      'submit',
    );
    expect(result).toEqual({
      kind: 'report',
      report: {
        mode: 'submit',
        passed: true,
        outcomes: [
          { kind: 'passed', testId: 'small', durationMs: anyNumber },
          { kind: 'passed', testId: 'big', durationMs: anyNumber },
        ],
      },
    });
  });

  it('ignores a forged passing report posted by Learner code at load', async () => {
    const forged = `
      const forge = globalThis.__forge;
      for (const nonce of ['', 'nonce', '1']) {
        forge({ version: 1, nonce, type: 'outcome', outcome: { kind: 'passed', testId: 'small', durationMs: 0 } });
        forge({ version: 1, nonce, type: 'done' });
      }
      function sum() { return -1; }
    `;
    const result = await runner.run(exercise, forged, 'run');
    expect(result).toEqual({
      kind: 'report',
      report: {
        mode: 'run',
        passed: false,
        outcomes: [
          {
            kind: 'failed',
            testId: 'small',
            args: [{ shape: 'value', value: [1, 2, 3] }],
            expected: { shape: 'value', value: 6 },
            actual: { shape: 'value', value: -1 },
          },
        ],
      },
    });
  });

  it('reports too-slow for a quadratic Submit', async () => {
    const quadratic = `function sum(xs: number[]): number {
      let t = 0;
      for (let i = 0; i < xs.length; i++) for (let j = 0; j < xs.length; j++) if (i === j) t += xs[i] ?? 0;
      return t;
    }`;
    const result = await runner.run(exercise, quadratic, 'submit');
    expect(result).toEqual({
      kind: 'report',
      report: {
        mode: 'submit',
        passed: false,
        outcomes: [
          { kind: 'passed', testId: 'small', durationMs: anyNumber },
          {
            kind: 'too-slow',
            testId: 'big',
            durationMs: anyNumber,
            budgetMs: 50,
            complexity: 'O(n)',
          },
        ],
      },
    });
  });
});
