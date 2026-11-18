import { describe, expect, it } from 'vitest';
import { err, ok } from '../result';
import { judge } from './judge';
import type { Check } from './types';

const predict: Check = {
  kind: 'predict',
  id: 'p',
  correct: { structureId: 's', elementId: 'e1' },
};
const choice: Check = { kind: 'choice', id: 'c', options: ['a', 'b'], correct: 'a' };
const order: Check = { kind: 'order', id: 'o', structureId: 's', correct: ['x', 'y', 'z'] };

describe('judge', () => {
  it('returns answer-kind-mismatch when the Answer kind differs from the Check kind', () => {
    expect(judge(predict, { kind: 'choice', option: 'a' })).toEqual(
      err({ code: 'answer-kind-mismatch' }),
    );
    expect(judge(choice, { kind: 'order', sequence: [] })).toEqual(
      err({ code: 'answer-kind-mismatch' }),
    );
    expect(judge(order, { kind: 'predict', target: { structureId: 's', elementId: 'x' } })).toEqual(
      err({ code: 'answer-kind-mismatch' }),
    );
  });

  it('judges a Predict Check correct when structureId and elementId both match', () => {
    expect(
      judge(predict, { kind: 'predict', target: { structureId: 's', elementId: 'e1' } }),
    ).toEqual(ok('correct'));
  });

  it('judges a Predict Check a Miss when the elementId differs', () => {
    expect(
      judge(predict, { kind: 'predict', target: { structureId: 's', elementId: 'e2' } }),
    ).toEqual(ok('miss'));
  });

  it('judges a Predict Check a Miss when the structureId differs', () => {
    expect(
      judge(predict, { kind: 'predict', target: { structureId: 't', elementId: 'e1' } }),
    ).toEqual(ok('miss'));
  });

  it('judges a Choice Check correct when the option equals correct', () => {
    expect(judge(choice, { kind: 'choice', option: 'a' })).toEqual(ok('correct'));
  });

  it('judges a Choice Check a Miss when the option differs', () => {
    expect(judge(choice, { kind: 'choice', option: 'b' })).toEqual(ok('miss'));
  });

  it('judges an Order Check correct only for the same ids in the same order', () => {
    expect(judge(order, { kind: 'order', sequence: ['x', 'y', 'z'] })).toEqual(ok('correct'));
  });

  it.each([
    ['a permutation', ['y', 'x', 'z']],
    ['a prefix', ['x', 'y']],
    ['a superset', ['x', 'y', 'z', 'w']],
    ['an empty sequence', []],
  ])('judges an Order Check a Miss for %s', (_name, sequence) => {
    expect(judge(order, { kind: 'order', sequence })).toEqual(ok('miss'));
  });

  it('does not mutate the Check or the Answer', () => {
    const answer = { kind: 'order', sequence: ['y', 'x', 'z'] } as const;
    const check = structuredClone(order);
    const answerCopy = structuredClone(answer);
    judge(check, answer);
    expect(check).toEqual(order);
    expect(answer).toEqual(answerCopy);
  });
});
