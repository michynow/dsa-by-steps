import type { Exercise } from '@/domain';
import { executeTests, transpile } from '@/runner';
import { modules } from './registry';
import { templateContent } from './_template';

const exercises: readonly (readonly [string, Exercise])[] = [
  ...modules.flatMap((module) =>
    module.lessons.flatMap((lesson) =>
      lesson.exercise === undefined
        ? []
        : [[`${module.slug}/${lesson.lesson.slug}`, lesson.exercise] as const],
    ),
  ),
  ...(templateContent.exercise === undefined
    ? []
    : [['template', templateContent.exercise] as const]),
];

const anyNumber = expect.any(Number) as number;

describe('reference solutions', () => {
  it('cover at least the template exercise', () => {
    expect(exercises.map(([name]) => name)).toContain('template');
  });

  it.each(exercises)('%s: starter code compiles', (_name, exercise) => {
    expect(transpile(exercise.starterCode).ok).toBe(true);
  });

  it.each(exercises)(
    '%s: the Reference Solution passes every visible and hidden test',
    (_name, exercise) => {
      const compiled = transpile(exercise.referenceSolution);
      expect(compiled.ok).toBe(true);
      if (!compiled.ok) return;
      const tests = [...exercise.visibleTests, ...exercise.hiddenTests];
      const outcomes = executeTests({
        code: compiled.value,
        functionName: exercise.functionName,
        tests,
      });
      expect(outcomes).toEqual(
        tests.map((test) => ({ kind: 'passed', testId: test.id, durationMs: anyNumber })),
      );
    },
  );
});
