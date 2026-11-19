import type {
  ComplexityTest,
  Exercise,
  JsonValue,
  RunMode,
  ShapedValue,
  TestCase,
  TestOutcome,
} from './types';

export const timeBudgetFloorMs = 50;

export function testsFor(exercise: Exercise, mode: RunMode): readonly TestCase[] {
  return mode === 'run'
    ? exercise.visibleTests
    : [...exercise.visibleTests, ...exercise.hiddenTests];
}

export function complexityFor(exercise: Exercise, mode: RunMode): ComplexityTest | undefined {
  return mode === 'submit' ? exercise.complexityTest : undefined;
}

export function reportPassed(outcomes: readonly TestOutcome[]): boolean {
  return outcomes.length > 0 && outcomes.every((outcome) => outcome.kind === 'passed');
}

export function timeBudget(referenceMs: number, multiple: number): number {
  return Math.max(referenceMs * multiple, timeBudgetFloorMs);
}

function isPlainObject(value: object): boolean {
  const prototype: unknown = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function isDense(items: readonly unknown[]): boolean {
  return Object.keys(items).length === items.length;
}

export function isJsonValue(value: unknown): value is JsonValue {
  if (Array.isArray(value)) return isDense(value) && value.every(isJsonValue);
  if (typeof value === 'object' && value !== null) {
    return isPlainObject(value) && Object.values(value).every(isJsonValue);
  }
  if (typeof value === 'number') return Number.isFinite(value);
  return value === null || typeof value === 'boolean' || typeof value === 'string';
}

export function hasValidShape(shaped: ShapedValue): boolean {
  return shaped.shape === 'value' || shaped.value === null || Array.isArray(shaped.value);
}

function hasExactKeys(value: object): boolean {
  const keys = Object.keys(value).sort();
  return keys.length === 2 && keys[0] === 'shape' && keys[1] === 'value';
}

function isShapeName(shape: unknown): shape is ShapedValue['shape'] {
  return shape === 'value' || shape === 'linked-list';
}

export function isShapedValue(value: unknown): value is ShapedValue {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  if (!hasExactKeys(value) || !('shape' in value) || !('value' in value)) return false;
  return (
    isShapeName(value.shape) &&
    isJsonValue(value.value) &&
    hasValidShape({ shape: value.shape, value: value.value })
  );
}
