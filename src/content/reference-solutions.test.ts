import type { Exercise } from '@/domain';
import { executeTests, measureComplexity, transpile } from '@/runner';
import { templateContent } from './_template';
import { modules } from './registry';

const anyNumber = expect.any(Number) as number;

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

const withComplexity = exercises.filter(([, exercise]) => exercise.complexityTest !== undefined);

describe('reference solutions', () => {
  it('cover at least the template exercise', () => {
    expect(exercises.map(([name]) => name)).toContain('template');
  });

  it.each(exercises)('%s: starter code compiles', async (_name, exercise) => {
    expect((await transpile(exercise.starterCode)).ok).toBe(true);
  });

  it.each(exercises)(
    '%s: the Reference Solution passes every visible and hidden test',
    async (_name, exercise) => {
      const compiled = await transpile(exercise.referenceSolution);
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

  it.each(withComplexity)(
    '%s: the Reference Solution passes its own Complexity Test within budget',
    async (_name, exercise) => {
      const compiled = await transpile(exercise.referenceSolution);
      expect(compiled.ok).toBe(true);
      if (!compiled.ok || exercise.complexityTest === undefined) return;
      expect(
        measureComplexity({
          learnerCode: compiled.value,
          referenceCode: compiled.value,
          functionName: exercise.functionName,
          test: exercise.complexityTest,
        }),
      ).toEqual({
        ok: true,
        value: { kind: 'passed', testId: exercise.complexityTest.id, durationMs: anyNumber },
      });
    },
  );

  it('includes at least one Exercise with a Complexity Test', () => {
    expect(withComplexity.length).toBeGreaterThan(0);
  });
});
