import { useCallback, useRef, useState } from 'react';
import type { Exercise, LessonKey, RunMode } from '@/domain';
import { useProgressActions } from '@/features/progress';
import type { RunResult } from '@/runner';
import type { CursorTarget } from './CodeEditor';
import { useExerciseRunner } from './runner-context';

export interface ExerciseRun {
  readonly running: RunMode | null;
  readonly result: RunResult | null;
  readonly cursor: CursorTarget | null;
  readonly start: (mode: RunMode) => void;
}

interface RunState {
  readonly running: RunMode | null;
  readonly result: RunResult | null;
  readonly cursor: CursorTarget | null;
  readonly runs: number;
}

const idle: RunState = { running: null, result: null, cursor: null, runs: 0 };

function checkerFailure(): RunResult {
  return { kind: 'internal-error', message: 'The runner rejected the request' };
}

function cursorOf(result: RunResult, nonce: number): CursorTarget | null {
  return result.kind === 'compile-error'
    ? { line: result.error.line, column: result.error.column, nonce }
    : null;
}

export function useExerciseRun(
  exercise: Exercise,
  lesson: LessonKey,
  readCode: () => string,
): ExerciseRun {
  const runner = useExerciseRunner();
  const actions = useProgressActions();
  const [state, setState] = useState<RunState>(idle);
  const busy = useRef(false);

  const finish = useCallback(
    (mode: RunMode, result: RunResult) => {
      busy.current = false;
      if (mode === 'submit' && result.kind !== 'internal-error') {
        const passed = result.kind === 'report' && result.report.passed;
        actions.recordSubmit(lesson, passed ? 'pass' : 'rejection');
      }
      setState((current) => ({
        running: null,
        result,
        cursor: cursorOf(result, current.runs + 1),
        runs: current.runs + 1,
      }));
    },
    [lesson, actions],
  );

  const start = useCallback(
    (mode: RunMode) => {
      if (busy.current) return;
      busy.current = true;
      setState((current) => ({ ...current, running: mode }));
      void runner
        .run(exercise, readCode(), mode)
        .catch(checkerFailure)
        .then((result) => {
          finish(mode, result);
        });
    },
    [runner, exercise, readCode, finish],
  );

  return { running: state.running, result: state.result, cursor: state.cursor, start };
}
