import { hasValidShape, isJsonValue } from '@/domain';
import type { ShapedValue } from '@/domain';
import { hasListShape, isStrictJson } from './exercise-values';

class Point {
  x = 1;
}
const sparse: unknown[] = [];
sparse[2] = 1;

const values: readonly unknown[] = [
  null,
  true,
  'x',
  0,
  [],
  [1, [2]],
  { a: [null] },
  Object.create(null),
  Number.NaN,
  Number.POSITIVE_INFINITY,
  undefined,
  new Point(),
  new Date(0),
  sparse,
  [Number.NaN],
  () => 1,
];

describe('exercise value predicates', () => {
  it('agree with the domain JSON predicate', () => {
    expect(values.map(isStrictJson)).toEqual(values.map(isJsonValue));
  });

  it('agree with the domain shape predicate', () => {
    const shaped: readonly ShapedValue[] = [
      { shape: 'value', value: 1 },
      { shape: 'linked-list', value: null },
      { shape: 'linked-list', value: [1] },
      { shape: 'linked-list', value: 3 },
      { shape: 'linked-list', value: { a: 1 } },
    ];
    expect(shaped.map(hasListShape)).toEqual(shaped.map(hasValidShape));
    expect(shaped.map(hasListShape)).toEqual([true, true, true, false, false]);
  });
});
