import type { Result } from '@/domain';
import { assertNever, ok } from '@/domain';
import { measureComplexity } from './complexity';
import { executeTestsStreaming } from './execute';
import type { RunRequest, RunResponse } from './protocol';
import { parseRunRequest, protocolVersion } from './protocol';

type Post = (response: RunResponse) => void;

function tagOf(request: RunRequest) {
  return { version: protocolVersion, nonce: request.nonce } as const;
}

function runTests(request: Extract<RunRequest, { type: 'run-tests' }>, post: Post): void {
  const tag = tagOf(request);
  executeTestsStreaming(request, {
    started: (testId) => {
      post({ ...tag, type: 'test-started', testId });
    },
    outcome: (outcome) => {
      post({ ...tag, type: 'outcome', outcome });
    },
  });
  post({ ...tag, type: 'done' });
}

function runComplexity(request: Extract<RunRequest, { type: 'run-complexity' }>, post: Post): void {
  const tag = tagOf(request);
  const result = measureComplexity({
    ...request,
    onReferenceTimed: (timing) => {
      post({ ...tag, type: 'reference-timed', ms: timing.ms, budgetMs: timing.budgetMs });
    },
  });
  if (result.ok) {
    post({ ...tag, type: 'outcome', outcome: result.value });
    post({ ...tag, type: 'done' });
  } else {
    post({ ...tag, type: 'internal-error', message: result.error });
  }
}

function dispatch(request: RunRequest, post: Post): void {
  switch (request.type) {
    case 'run-tests':
      runTests(request, post);
      return;
    case 'run-complexity':
      runComplexity(request, post);
      return;
    default:
      assertNever(request);
  }
}

export function handleRunRequest(data: unknown, post: Post): Result<void, string> {
  const request = parseRunRequest(data);
  if (!request.ok) return request;
  dispatch(request.value, post);
  return ok(undefined);
}
