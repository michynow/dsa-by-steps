import { assertNever } from '../assert-never';
import { err, ok } from '../result';
import type { Result } from '../result';
import type { Answer, Check, CheckError, Verdict } from './types';

const verdictOf = (isCorrect: boolean): Verdict => (isCorrect ? 'correct' : 'miss');

const mismatch: Result<never, CheckError> = err({ code: 'answer-kind-mismatch' });

export function judge(check: Check, answer: Answer): Result<Verdict, CheckError> {
  switch (check.kind) {
    case 'predict':
      return answer.kind === 'predict'
        ? ok(
            verdictOf(
              answer.target.structureId === check.correct.structureId &&
                answer.target.elementId === check.correct.elementId,
            ),
          )
        : mismatch;
    case 'choice':
      return answer.kind === 'choice' ? ok(verdictOf(answer.option === check.correct)) : mismatch;
    case 'order':
      return answer.kind === 'order'
        ? ok(
            verdictOf(
              answer.sequence.length === check.correct.length &&
                answer.sequence.every((id, index) => id === check.correct[index]),
            ),
          )
        : mismatch;
    default:
      return assertNever(check);
  }
}
