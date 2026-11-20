import { scenesOf } from '@/domain';
import type { JsonValue, TestCase } from '@/domain';
import { validateLessonContent } from '../../validate-lesson';
import { linkedListsContent } from './index';

const exercise = linkedListsContent.exercise;
const visible = exercise?.visibleTests ?? [];
const hidden = exercise?.hiddenTests ?? [];
const allTests: readonly TestCase[] = [...visible, ...hidden];

function isList(value: JsonValue): value is readonly JsonValue[] {
  return Array.isArray(value);
}

function reversedCopy(value: JsonValue): JsonValue {
  return isList(value) ? value.toReversed() : value;
}

function lessonIssues() {
  const scenes = scenesOf(linkedListsContent.lesson);
  return scenes.ok ? validateLessonContent(linkedListsContent, scenes.value) : scenes;
}

describe('reverseList Exercise', () => {
  it('has an Exercise and zero content issues for the Lesson', () => {
    expect({ declared: exercise !== undefined, issues: lessonIssues() }).toEqual({
      declared: true,
      issues: [],
    });
  });

  it('expects the reversed input for every visible and hidden test', () => {
    expect(allTests.length).toBeGreaterThan(0);
    expect(allTests.map((test) => ({ id: test.id, expected: test.expected.value }))).toEqual(
      allTests.map((test) => ({
        id: test.id,
        expected: reversedCopy(test.args[0]?.value ?? null),
      })),
    );
  });

  it('gives every test one linked-list argument and a linked-list expectation', () => {
    expect(allTests.length).toBeGreaterThan(0);
    expect(
      allTests.map((test) => ({
        id: test.id,
        args: test.args.map((arg) => arg.shape),
        expected: test.expected.shape,
      })),
    ).toEqual(
      allTests.map((test) => ({ id: test.id, args: ['linked-list'], expected: 'linked-list' })),
    );
  });

  it('has unique kebab-case test ids, 5 visible and 5 to 7 hidden tests', () => {
    const ids = allTests.map((test) => test.id);
    expect({
      kebab: ids.filter((id) => !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(id)),
      unique: new Set(ids).size === ids.length,
      visible: visible.length,
      hiddenInRange: hidden.length >= 5 && hidden.length <= 7,
    }).toEqual({ kebab: [], unique: true, visible: 5, hiddenInRange: true });
  });

  it('declares the function name, Complexity Test and Hint count', () => {
    expect({
      functionName: exercise?.functionName,
      complexityTest: exercise?.complexityTest,
      hintCount: exercise?.hintCount,
    }).toEqual({
      functionName: 'reverseList',
      complexityTest: {
        id: 'long-hunt-complexity',
        generator: { kind: 'linked-list-range', size: 100000 },
        expected: 'reference',
        budgetMultiple: 8,
        complexity: 'O(n)',
      },
      hintCount: 3,
    });
  });
});
