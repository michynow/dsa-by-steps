import { err, ok } from '../result';
import type { Result } from '../result';
import { missesBeforeReveal } from './types';
import type { CheckError, CheckState, Verdict } from './types';

const settled = (state: CheckState): Result<never, CheckError> =>
  err({ code: 'already-settled', status: state.status });

export function recordVerdict(state: CheckState, verdict: Verdict): Result<CheckState, CheckError> {
  if (state.status !== 'open') return settled(state);
  return ok(
    verdict === 'correct'
      ? { misses: state.misses, status: 'passed' }
      : { misses: state.misses + 1, status: 'open' },
  );
}

export function canReveal(state: CheckState): boolean {
  return state.status === 'open' && state.misses >= missesBeforeReveal;
}

export function reveal(state: CheckState): Result<CheckState, CheckError> {
  if (state.status !== 'open') return settled(state);
  if (!canReveal(state)) return err({ code: 'reveal-unavailable', misses: state.misses });
  return ok({ misses: state.misses, status: 'revealed' });
}
