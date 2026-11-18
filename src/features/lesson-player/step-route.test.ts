import { testModules } from '@/test/lesson-fixtures';
import { segmentOf, stepIndexOf } from './step-route';

const lesson = testModules[0]?.lessons[0]?.lesson;
const bare = testModules[2]?.lessons[0]?.lesson;

describe('step route segments', () => {
  it.each([
    ['1', 0],
    ['3', 2],
    ['code', 3],
    ['0', undefined],
    ['-1', undefined],
    ['1.5', undefined],
    ['abc', undefined],
    ['4', undefined],
    ['01', undefined],
    [undefined, undefined],
  ])('reads %s as %s', (segment, index) => {
    expect(lesson && stepIndexOf(segment, lesson)).toBe(index);
  });

  it('treats step 1 of a Lesson without Steps as out of range', () => {
    expect(bare && [stepIndexOf('1', bare), stepIndexOf('code', bare)]).toEqual([undefined, 0]);
  });

  it('writes the Exercise as code and Steps as 1-based numbers', () => {
    expect(lesson && [segmentOf(lesson, 0), segmentOf(lesson, 2), segmentOf(lesson, 3)]).toEqual([
      '1',
      '3',
      'code',
    ]);
  });
});
