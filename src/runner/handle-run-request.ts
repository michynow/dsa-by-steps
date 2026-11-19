import type { Exercise, Result, TestOutcome } from '@/domain';
import { complexityFor, err, ok, reportPassed, testsFor } from '@/domain';
import { measureComplexity } from './complexity';
import { executeTests } from './execute';
import type { RunRequest, RunResponse } from './protocol';
import { parseRunRequest, protocolVersion } from './protocol';
import { transpile } from './transpile';

function toExercise(request: RunRequest): Exercise {
  const { complexityTest, ...rest } = request.exercise;
  return {
    ...rest,
    ...(complexityTest === undefined ? {} : { complexityTest }),
    starterCode: '',
    hintCount: 0,
  };
}

function outcomesFor(request: RunRequest, learnerCode: string, referenceCode: string) {
  const exercise = toExercise(request);
  const { functionName } = exercise;
  const tests = executeTests({
    code: learnerCode,
    functionName,
    tests: testsFor(exercise, request.mode),
  });
  const complexityTest = complexityFor(exercise, request.mode);
  if (complexityTest === undefined) return tests;
  const complexity = measureComplexity({
    learnerCode,
    referenceCode,
    functionName,
    test: complexityTest,
  });
  return [...tests, complexity];
}

function respond(request: RunRequest): Result<RunResponse, string> {
  const learner = transpile(request.code);
  if (!learner.ok) {
    return ok({ version: protocolVersion, type: 'compile-error', error: learner.error });
  }
  const reference = transpile(request.exercise.referenceSolution);
  if (!reference.ok) return err(`Reference Solution does not compile: ${reference.error.message}`);
  const outcomes: readonly TestOutcome[] = outcomesFor(request, learner.value, reference.value);
  const report = { mode: request.mode, outcomes, passed: reportPassed(outcomes) };
  return ok({ version: protocolVersion, type: 'report', report });
}

export function handleRunRequest(data: unknown): Result<RunResponse, string> {
  const request = parseRunRequest(data);
  return request.ok ? respond(request.value) : request;
}
