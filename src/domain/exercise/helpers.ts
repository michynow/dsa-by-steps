import type { Exercise, JsonValue, RunMode, ShapedValue, TestCase, TestOutcome } from './types';

export const timeBudgetFloorMs = 50;

export function testsFor(exercise: Exercise, mode: RunMode): readonly TestCase[] {
  return mode === 'run'
    ? exercise.visibleTests
    : [...exercise.visibleTests, ...exercise.hiddenTests];
}

export function reportPassed(outcomes: readonly TestOutcome[]): boolean {
  return outcomes.length > 0 && outcomes.every((outcome) => outcome.kind === 'passed');
}

export function timeBudget(referenceMs: number, multiple: number): number {
  return Math.max(referenceMs * multiple, timeBudgetFloorMs);
}

function isJsonValue(value: unknown): value is JsonValue {
  if (Array.isArray(value)) return value.every(isJsonValue);
  if (typeof value === 'object' && value !== null) return Object.values(value).every(isJsonValue);
  if (typeof value === 'number') return Number.isFinite(value);
  return value === null || typeof value === 'boolean' || typeof value === 'string';
}

function hasExactKeys(value: object): boolean {
  const keys = Object.keys(value).sort();
  return keys.length === 2 && keys[0] === 'shape' && keys[1] === 'value';
}

export function isShapedValue(value: unknown): value is ShapedValue {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  return (
    hasExactKeys(value) &&
    'shape' in value &&
    (value.shape === 'value' || value.shape === 'linked-list') &&
    'value' in value &&
    isJsonValue(value.value)
  );
}
