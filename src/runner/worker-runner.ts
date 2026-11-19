import type { Exercise, RunMode } from '@/domain';
import { parseRunResponse, protocolVersion } from './protocol';
import type { RunRequest } from './protocol';
import type { RunResult, WorkerLike } from './types';

export interface WorkerRunnerOptions {
  readonly createWorker?: () => WorkerLike;
  readonly limitMs?: number;
}

export interface ExerciseRunner {
  run(exercise: Exercise, code: string, mode: RunMode): Promise<RunResult>;
}

const defaultLimitMs = 5000;

function createBrowserWorker(): WorkerLike {
  return new Worker(new URL('./exercise.worker.ts', import.meta.url), { type: 'module' });
}

function requestFor(exercise: Exercise, code: string, mode: RunMode): RunRequest {
  const { functionName, visibleTests, hiddenTests, complexityTest, referenceSolution } = exercise;
  return {
    version: protocolVersion,
    type: 'run',
    mode,
    exercise: {
      functionName,
      visibleTests,
      hiddenTests,
      ...(complexityTest === undefined ? {} : { complexityTest }),
      referenceSolution,
    },
    code,
  };
}

export function createWorkerExerciseRunner(options: WorkerRunnerOptions = {}): ExerciseRunner {
  const createWorker = options.createWorker ?? createBrowserWorker;
  const limitMs = options.limitMs ?? defaultLimitMs;
  return {
    run: (exercise, code, mode) =>
      new Promise<RunResult>((resolve, reject) => {
        const worker = createWorker();
        const finish = (settle: () => void): void => {
          clearTimeout(timer);
          worker.terminate();
          settle();
        };
        const timer = setTimeout(() => {
          finish(() => {
            resolve({ kind: 'timed-out', limitMs });
          });
        }, limitMs);
        worker.onmessage = (event) => {
          const response = parseRunResponse(event.data);
          finish(() => {
            if (!response.ok) reject(new Error(response.error));
            else if (response.value.type === 'report') {
              resolve({ kind: 'report', report: response.value.report });
            } else resolve({ kind: 'compile-error', error: response.value.error });
          });
        };
        worker.postMessage(requestFor(exercise, code, mode));
      }),
  };
}
