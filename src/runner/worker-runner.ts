import type { Exercise, RunMode, RunReport, TestOutcome } from '@/domain';
import { complexityFor, reportPassed, testsFor } from '@/domain';
import { complexityPhase, runPhase, testsPhase } from './phases';
import type { PhaseResult } from './phases';
import { transpile } from './transpile';
import type { RunResult, WorkerLike } from './types';

export interface WorkerRunnerOptions {
  readonly createWorker?: () => WorkerLike;
  readonly testLimitMs?: number;
  readonly graceMs?: number;
  readonly createNonce?: () => string;
}

export interface ExerciseRunner {
  run(exercise: Exercise, code: string, mode: RunMode): Promise<RunResult>;
}

const defaultTestLimitMs = 2000;
const defaultGraceMs = 500;

function createBrowserWorker(): WorkerLike {
  return new Worker(new URL('./exercise.worker.ts', import.meta.url), { type: 'module' });
}

function internalError(message: string): RunResult {
  return { kind: 'internal-error', message };
}

function reportOf(mode: RunMode, outcomes: readonly TestOutcome[]): RunResult {
  const report: RunReport = { mode, outcomes, passed: reportPassed(outcomes) };
  return { kind: 'report', report };
}

export function createWorkerExerciseRunner(options: WorkerRunnerOptions = {}): ExerciseRunner {
  const createWorker = options.createWorker ?? createBrowserWorker;
  const testLimitMs = options.testLimitMs ?? defaultTestLimitMs;
  const graceMs = options.graceMs ?? defaultGraceMs;
  const createNonce = options.createNonce ?? (() => crypto.randomUUID());
  const tag = () => ({ version: 1, nonce: createNonce() }) as const;

  async function runCorrectness(exercise: Exercise, code: string, mode: RunMode) {
    const tests = testsFor(exercise, mode);
    return runPhase(
      createWorker(),
      { ...tag(), type: 'run-tests', functionName: exercise.functionName, code, tests },
      testsPhase(tests, testLimitMs),
    );
  }

  async function runComplexity(
    exercise: Exercise,
    learnerCode: string,
    referenceCode: string,
    mode: RunMode,
  ): Promise<PhaseResult<readonly TestOutcome[]>> {
    const test = complexityFor(exercise, mode);
    if (test === undefined) return { kind: 'finished', value: [] };
    const result = await runPhase(
      createWorker(),
      {
        ...tag(),
        type: 'run-complexity',
        functionName: exercise.functionName,
        learnerCode,
        referenceCode,
        test,
      },
      complexityPhase(test, testLimitMs, graceMs),
    );
    return result.kind === 'finished' ? { kind: 'finished', value: [result.value] } : result;
  }

  return {
    run: async (exercise, code, mode) => {
      const learner = await transpile(code);
      if (!learner.ok) return { kind: 'compile-error', error: learner.error };
      const reference = await transpile(exercise.referenceSolution);
      if (!reference.ok) {
        return internalError(`Reference Solution does not compile: ${reference.error.message}`);
      }
      const correctness = await runCorrectness(exercise, learner.value, mode);
      if (correctness.kind === 'internal-error') return internalError(correctness.message);
      const complexityTest = complexityFor(exercise, mode);
      if (complexityTest === undefined) return reportOf(mode, correctness.value);
      if (!reportPassed(correctness.value)) {
        const skipped: TestOutcome = { kind: 'skipped', testId: complexityTest.id };
        return reportOf(mode, [...correctness.value, skipped]);
      }
      const complexity = await runComplexity(exercise, learner.value, reference.value, mode);
      if (complexity.kind === 'internal-error') return internalError(complexity.message);
      return reportOf(mode, [...correctness.value, ...complexity.value]);
    },
  };
}
