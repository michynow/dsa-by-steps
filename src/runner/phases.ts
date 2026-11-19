import type { ComplexityTest, TestCase, TestOutcome } from '@/domain';
import { assertNever } from '@/domain';
import type { RunRequest, RunResponse } from './protocol';
import { parseRunResponse } from './protocol';
import type { WorkerLike } from './types';

export type PhaseMessage = Exclude<RunResponse, { type: 'internal-error' }>;

export type PhaseResult<R> =
  | { readonly kind: 'finished'; readonly value: R }
  | { readonly kind: 'internal-error'; readonly message: string };

export interface Step<S> {
  readonly state: S;
  readonly done: boolean;
  readonly limitMs: number;
}

export interface Phase<S, R> {
  readonly initial: S;
  readonly initialLimitMs: number;
  readonly step: (state: S, message: PhaseMessage) => Step<S>;
  readonly onTimeout: (state: S) => PhaseResult<R>;
  readonly finish: (state: S) => R;
}

function skippedFrom(tests: readonly TestCase[], from: number): readonly TestOutcome[] {
  return tests.slice(from).map((test) => ({ kind: 'skipped', testId: test.id }));
}

export function testsPhase(
  tests: readonly TestCase[],
  limitMs: number,
): Phase<readonly TestOutcome[], readonly TestOutcome[]> {
  const keep = (state: readonly TestOutcome[], done: boolean): Step<readonly TestOutcome[]> => ({
    state,
    done,
    limitMs,
  });
  return {
    initial: [],
    initialLimitMs: limitMs,
    step: (state, message) => {
      switch (message.type) {
        case 'test-started':
        case 'reference-timed':
          return keep(state, false);
        case 'outcome':
          return message.outcome.testId === tests[state.length]?.id
            ? keep([...state, message.outcome], false)
            : keep(state, false);
        case 'done':
          return keep(state, true);
        default:
          return assertNever(message);
      }
    },
    onTimeout: (state) => {
      const stuck = tests[state.length];
      const hung: readonly TestOutcome[] =
        stuck === undefined ? [] : [{ kind: 'timed-out', testId: stuck.id, limitMs }];
      return {
        kind: 'finished',
        value: [...state, ...hung, ...skippedFrom(tests, state.length + 1)],
      };
    },
    finish: (state) => [...state, ...skippedFrom(tests, state.length)],
  };
}

interface ComplexityState {
  readonly budgetMs: number | undefined;
  readonly startedAt: number;
  readonly outcome: TestOutcome | undefined;
}

export function complexityPhase(
  test: ComplexityTest,
  setupLimitMs: number,
  graceMs: number,
): Phase<ComplexityState, TestOutcome> {
  const idle: ComplexityState = { budgetMs: undefined, startedAt: 0, outcome: undefined };
  return {
    initial: idle,
    initialLimitMs: setupLimitMs,
    step: (state, message) => {
      switch (message.type) {
        case 'test-started':
          return { state, done: false, limitMs: setupLimitMs };
        case 'reference-timed':
          return {
            state: { ...state, budgetMs: message.budgetMs, startedAt: Date.now() },
            done: false,
            limitMs: message.budgetMs + graceMs,
          };
        case 'outcome':
          return {
            state:
              message.outcome.testId === test.id ? { ...state, outcome: message.outcome } : state,
            done: false,
            limitMs: setupLimitMs,
          };
        case 'done':
          return { state, done: true, limitMs: setupLimitMs };
        default:
          return assertNever(message);
      }
    },
    onTimeout: (state) =>
      state.budgetMs === undefined
        ? { kind: 'internal-error', message: 'Reference Solution did not finish in time' }
        : {
            kind: 'finished',
            value: {
              kind: 'too-slow',
              testId: test.id,
              durationMs: Date.now() - state.startedAt,
              budgetMs: state.budgetMs,
              complexity: test.complexity,
            },
          },
    finish: (state) => state.outcome ?? { kind: 'skipped', testId: test.id },
  };
}

export function runPhase<S, R>(
  worker: WorkerLike,
  request: RunRequest,
  phase: Phase<S, R>,
): Promise<PhaseResult<R>> {
  return new Promise((resolve) => {
    let state = phase.initial;
    let settled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const settle = (result: PhaseResult<R>): void => {
      settled = true;
      clearTimeout(timer);
      worker.terminate();
      resolve(result);
    };
    const arm = (ms: number): void => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        settle(phase.onTimeout(state));
      }, ms);
    };
    worker.onmessage = (event) => {
      const parsed = parseRunResponse(event.data);
      if (settled || !parsed.ok || parsed.value.nonce !== request.nonce) return;
      const message = parsed.value;
      if (message.type === 'internal-error') {
        settle({ kind: 'internal-error', message: message.message });
        return;
      }
      const next = phase.step(state, message);
      state = next.state;
      if (next.done) settle({ kind: 'finished', value: phase.finish(state) });
      else arm(next.limitMs);
    };
    worker.onerror = (event) => {
      if (!settled) settle({ kind: 'internal-error', message: event.message });
    };
    arm(phase.initialLimitMs);
    worker.postMessage(request);
  });
}
