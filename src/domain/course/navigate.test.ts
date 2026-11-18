import { describe, expect, it } from 'vitest';
import { emptyScene } from '../scene';
import { emptyProgress, lessonKey, recordSubmit } from '../progress';
import type { Course, CoursePosition, Lesson, Module, Step } from './types';
import { firstPosition, locate, nextPosition, previousPosition } from './navigate';
import { moduleProgress } from './module-progress';

function step(id: string): Step {
  return { id, kind: 'explain', events: [] };
}

function lesson(slug: string, stepCount: number): Lesson {
  return {
    slug,
    outcomes: [],
    initialScene: emptyScene,
    steps: Array.from({ length: stepCount }, (_, i) => step(`${slug}-${String(i)}`)),
  };
}

function module(slug: string, lessons: readonly Lesson[]): Module {
  return { slug, lessons };
}

function at(moduleSlug: string, lessonSlug: string, stepIndex: number): CoursePosition {
  return { module: moduleSlug, lesson: lessonSlug, step: stepIndex };
}

const course: Course = {
  modules: [
    module('arrays', [lesson('basics', 2), lesson('search', 1)]),
    module('lists', [lesson('nodes', 0), lesson('reverse', 2)]),
    module('trees', [lesson('bst', 1)]),
  ],
};

const courseWithEmptyModules: Course = {
  modules: [
    module('empty-first', []),
    module('a', [lesson('one', 1)]),
    module('empty-middle', []),
    module('b', [lesson('two', 1)]),
    module('empty-last', []),
  ],
};

const zeroStepAcrossModules: Course = {
  modules: [module('a', [lesson('x', 1)]), module('b', [lesson('z', 0)])],
};

const sharedSlugCourse: Course = {
  modules: [module('m1', [lesson('shared', 1)]), module('m2', [lesson('shared', 1)])],
};

function deepFreeze<T>(value: T): T {
  if (typeof value === 'object' && value !== null && !Object.isFrozen(value)) {
    Object.freeze(value);
    Object.values(value).forEach(deepFreeze);
  }
  return value;
}

describe('locate', () => {
  it('resolves a Step', () => {
    expect(locate(course, at('lists', 'reverse', 1))).toEqual({
      ok: true,
      value: {
        module: course.modules[1],
        lesson: course.modules[1]?.lessons[1],
        moduleIndex: 1,
        lessonIndex: 1,
        step: 1,
        isExercise: false,
      },
    });
  });
  it('resolves the Exercise when step equals the step count', () => {
    const result = locate(course, at('arrays', 'basics', 2));
    expect(result.ok && result.value.isExercise).toBe(true);
  });
  it('treats step 0 of a zero-Step Lesson as the Exercise', () => {
    const result = locate(course, at('lists', 'nodes', 0));
    expect(result.ok && result.value.isExercise).toBe(true);
  });
  it('rejects an unknown Module', () => {
    expect(locate(course, at('graphs', 'basics', 0))).toEqual({
      ok: false,
      error: { code: 'unknown-module', module: 'graphs' },
    });
  });
  it('rejects an unknown Lesson in a known Module', () => {
    expect(locate(course, at('arrays', 'nope', 0))).toEqual({
      ok: false,
      error: { code: 'unknown-lesson', module: 'arrays', lesson: 'nope' },
    });
  });
  it.each([-1, 3, 0.5, Number.NaN])('rejects step %s as out of range', (bad) => {
    expect(locate(course, at('arrays', 'basics', bad))).toEqual({
      ok: false,
      error: {
        code: 'step-out-of-range',
        module: 'arrays',
        lesson: 'basics',
        step: bad,
        stepCount: 2,
      },
    });
  });
});

describe('firstPosition', () => {
  it('is step 0 of the first Lesson', () => {
    expect(firstPosition(course)).toEqual(at('arrays', 'basics', 0));
  });
  it('skips empty Modules', () => {
    expect(firstPosition(courseWithEmptyModules)).toEqual(at('a', 'one', 0));
  });
  it('is null for a Course with no Lessons', () => {
    expect(firstPosition({ modules: [module('x', [])] })).toBeNull();
    expect(firstPosition({ modules: [] })).toBeNull();
  });
});

describe('nextPosition', () => {
  it('moves to the next Step within a Lesson', () => {
    expect(nextPosition(course, at('arrays', 'basics', 0))).toEqual({
      ok: true,
      value: at('arrays', 'basics', 1),
    });
  });
  it('moves from the last Step to the Exercise', () => {
    expect(nextPosition(course, at('arrays', 'basics', 1))).toEqual({
      ok: true,
      value: at('arrays', 'basics', 2),
    });
  });
  it('moves from the Exercise to step 0 of the next Lesson', () => {
    expect(nextPosition(course, at('arrays', 'basics', 2))).toEqual({
      ok: true,
      value: at('arrays', 'search', 0),
    });
  });
  it('crosses into the next Module', () => {
    expect(nextPosition(course, at('arrays', 'search', 1))).toEqual({
      ok: true,
      value: at('lists', 'nodes', 0),
    });
  });
  it('skips empty Modules', () => {
    expect(nextPosition(courseWithEmptyModules, at('a', 'one', 1))).toEqual({
      ok: true,
      value: at('b', 'two', 0),
    });
  });
  it('moves from a zero-Step Lesson Exercise to the next Lesson', () => {
    expect(nextPosition(course, at('lists', 'nodes', 0))).toEqual({
      ok: true,
      value: at('lists', 'reverse', 0),
    });
  });
  it('is null after the last Exercise of the Course', () => {
    expect(nextPosition(course, at('trees', 'bst', 1))).toEqual({ ok: true, value: null });
    expect(nextPosition(courseWithEmptyModules, at('b', 'two', 1))).toEqual({
      ok: true,
      value: null,
    });
  });
  it('propagates errors', () => {
    expect(nextPosition(course, at('graphs', 'x', 0))).toEqual({
      ok: false,
      error: { code: 'unknown-module', module: 'graphs' },
    });
    expect(nextPosition(course, at('arrays', 'nope', 0))).toEqual({
      ok: false,
      error: { code: 'unknown-lesson', module: 'arrays', lesson: 'nope' },
    });
    expect(nextPosition(course, at('arrays', 'basics', 9))).toEqual({
      ok: false,
      error: {
        code: 'step-out-of-range',
        module: 'arrays',
        lesson: 'basics',
        step: 9,
        stepCount: 2,
      },
    });
  });
  it('returns a fresh position without extra properties of the input', () => {
    const input = { ...at('arrays', 'basics', 0), extra: 'x' };
    expect(nextPosition(course, input)).toEqual({ ok: true, value: at('arrays', 'basics', 1) });
    const result = nextPosition(course, input);
    expect(result.ok && result.value && 'extra' in result.value).toBe(false);
  });
  it('moves from a Lesson Exercise to a following zero-Step Lesson in the next Module', () => {
    expect(nextPosition(zeroStepAcrossModules, at('a', 'x', 1))).toEqual({
      ok: true,
      value: at('b', 'z', 0),
    });
  });
});

describe('previousPosition', () => {
  it('moves to the previous Step within a Lesson', () => {
    expect(previousPosition(course, at('arrays', 'basics', 2))).toEqual({
      ok: true,
      value: at('arrays', 'basics', 1),
    });
  });
  it('moves from step 0 to the previous Lesson Exercise', () => {
    expect(previousPosition(course, at('arrays', 'search', 0))).toEqual({
      ok: true,
      value: at('arrays', 'basics', 2),
    });
  });
  it('crosses into the previous Module', () => {
    expect(previousPosition(course, at('trees', 'bst', 0))).toEqual({
      ok: true,
      value: at('lists', 'reverse', 2),
    });
  });
  it('lands on a zero-Step Lesson Exercise', () => {
    expect(previousPosition(course, at('lists', 'reverse', 0))).toEqual({
      ok: true,
      value: at('lists', 'nodes', 0),
    });
  });
  it('skips empty Modules', () => {
    expect(previousPosition(courseWithEmptyModules, at('b', 'two', 0))).toEqual({
      ok: true,
      value: at('a', 'one', 1),
    });
  });
  it('is null from the first position', () => {
    expect(previousPosition(course, at('arrays', 'basics', 0))).toEqual({ ok: true, value: null });
    expect(previousPosition(courseWithEmptyModules, at('a', 'one', 0))).toEqual({
      ok: true,
      value: null,
    });
  });
  it('propagates errors', () => {
    expect(previousPosition(course, at('graphs', 'x', 0))).toEqual({
      ok: false,
      error: { code: 'unknown-module', module: 'graphs' },
    });
    expect(previousPosition(course, at('arrays', 'nope', 0))).toEqual({
      ok: false,
      error: { code: 'unknown-lesson', module: 'arrays', lesson: 'nope' },
    });
    expect(previousPosition(course, at('arrays', 'basics', 9))).toEqual({
      ok: false,
      error: {
        code: 'step-out-of-range',
        module: 'arrays',
        lesson: 'basics',
        step: 9,
        stepCount: 2,
      },
    });
  });
  it('returns a fresh position without extra properties of the input', () => {
    const input = { ...at('arrays', 'basics', 2), extra: 'x' };
    const result = previousPosition(course, input);
    expect(result).toEqual({ ok: true, value: at('arrays', 'basics', 1) });
    expect(result.ok && result.value && 'extra' in result.value).toBe(false);
  });
  it('moves from a zero-Step Lesson in one Module to the previous Module Exercise', () => {
    expect(previousPosition(zeroStepAcrossModules, at('b', 'z', 0))).toEqual({
      ok: true,
      value: at('a', 'x', 1),
    });
  });
});

describe('walking the Course', () => {
  const expected: readonly CoursePosition[] = course.modules.flatMap((m) =>
    m.lessons.flatMap((l) =>
      Array.from({ length: l.steps.length + 1 }, (_, i) => at(m.slug, l.slug, i)),
    ),
  );

  function walk(
    from: CoursePosition | null,
    advance: (position: CoursePosition) => CoursePosition | null,
  ): readonly CoursePosition[] {
    const visited: CoursePosition[] = [];
    for (let current = from; current !== null; current = advance(current)) visited.push(current);
    return visited;
  }

  it('visits every Step and Exercise exactly once going forward and ends at null', () => {
    const forward = walk(firstPosition(course), (p) => {
      const result = nextPosition(course, p);
      return result.ok ? result.value : null;
    });
    expect(forward).toEqual(expected);
    expect(forward).toHaveLength(11);
  });

  it('visits the same positions in reverse going backward', () => {
    const last = expected[expected.length - 1] ?? null;
    const backward = walk(last, (p) => {
      const result = previousPosition(course, p);
      return result.ok ? result.value : null;
    });
    expect(backward).toEqual([...expected].reverse());
  });
});

describe('purity', () => {
  it('does not mutate deep-frozen inputs in any navigation function', () => {
    const frozenCourse = deepFreeze(structuredClone(course));
    const position = deepFreeze(at('arrays', 'basics', 1));
    const progress = deepFreeze(recordSubmit(emptyProgress, lessonKey('arrays', 'search'), 'pass'));
    expect(() => {
      locate(frozenCourse, position);
      firstPosition(frozenCourse);
      nextPosition(frozenCourse, position);
      previousPosition(frozenCourse, position);
      moduleProgress(frozenCourse, 'arrays', progress);
    }).not.toThrow();
    expect(frozenCourse).toEqual(course);
    expect(position).toEqual(at('arrays', 'basics', 1));
  });
});

describe('moduleProgress', () => {
  const passed = recordSubmit(emptyProgress, lessonKey('arrays', 'search'), 'pass');

  it('lists Lessons in Course order with their Pass state', () => {
    expect(moduleProgress(course, 'arrays', passed)).toEqual({
      ok: true,
      value: {
        module: 'arrays',
        lessons: [
          { lesson: 'basics', passed: false },
          { lesson: 'search', passed: true },
        ],
        passedCount: 1,
        lessonCount: 2,
      },
    });
  });
  it('is zero passed for empty Progress', () => {
    const result = moduleProgress(course, 'lists', emptyProgress);
    expect(result.ok && [result.value.passedCount, result.value.lessonCount]).toEqual([0, 2]);
  });
  it('handles a Module with no Lessons', () => {
    expect(moduleProgress(courseWithEmptyModules, 'empty-first', emptyProgress)).toEqual({
      ok: true,
      value: { module: 'empty-first', lessons: [], passedCount: 0, lessonCount: 0 },
    });
  });
  it('rejects an unknown Module', () => {
    expect(moduleProgress(course, 'graphs', emptyProgress)).toEqual({
      ok: false,
      error: { code: 'unknown-module', module: 'graphs' },
    });
  });
  it('keeps a Lesson slug shared by two Modules separate per Module', () => {
    const progress = recordSubmit(emptyProgress, lessonKey('m1', 'shared'), 'pass');
    const first = moduleProgress(sharedSlugCourse, 'm1', progress);
    const second = moduleProgress(sharedSlugCourse, 'm2', progress);
    expect(first.ok && first.value.passedCount).toBe(1);
    expect(second.ok && second.value.lessons).toEqual([{ lesson: 'shared', passed: false }]);
    expect(second.ok && second.value.passedCount).toBe(0);
  });
});
