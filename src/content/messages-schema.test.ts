import type { z } from 'zod';
import { templateContent } from './_template';
import { exerciseMessagesSchema, lessonMessagesSchema } from './messages-schema';
import type { ExerciseMessages, LessonMessages } from './types';

const valid = templateContent.messages.en;

function issuesOf(
  input: unknown,
): readonly { readonly code: string; readonly path: PropertyKey[] }[] {
  const result = lessonMessagesSchema.safeParse(input);
  return result.success ? [] : result.error.issues.map(({ code, path }) => ({ code, path }));
}

describe('lessonMessagesSchema', () => {
  it('accepts valid messages unchanged', () => {
    expect(lessonMessagesSchema.parse(valid)).toEqual(valid);
  });

  it('rejects an unknown key', () => {
    expect(issuesOf({ ...valid, subtitle: 'x' })).toEqual([
      { code: 'unrecognized_keys', path: [] },
    ]);
  });

  it('rejects an unknown key inside a Step', () => {
    expect(
      issuesOf({
        ...valid,
        steps: { 'the-problem': { title: 't', caption: 'c', extra: 'x' } },
      }),
    ).toEqual([{ code: 'unrecognized_keys', path: ['steps', 'the-problem'] }]);
  });

  it('rejects an empty string', () => {
    expect(issuesOf({ ...valid, steps: { 'the-problem': { title: '', caption: 'c' } } })).toEqual([
      { code: 'too_small', path: ['steps', 'the-problem', 'title'] },
    ]);
  });

  it('rejects a missing required field', () => {
    expect(
      issuesOf({ ...valid, checks: { 'which-index': { prompt: 'p', explanation: undefined } } }),
    ).toEqual([{ code: 'invalid_type', path: ['checks', 'which-index', 'explanation'] }]);
  });

  it('rejects a missing top-level field', () => {
    expect(issuesOf({ ...valid, terms: undefined })).toEqual([
      { code: 'invalid_type', path: ['terms'] },
    ]);
  });

  it('rejects a missing story', () => {
    expect(issuesOf({ ...valid, story: undefined })).toEqual([
      { code: 'invalid_type', path: ['story'] },
    ]);
  });

  it('rejects two uses', () => {
    expect(issuesOf({ ...valid, uses: valid.uses.slice(0, 2) })).toEqual([
      { code: 'too_small', path: ['uses'] },
    ]);
  });

  it('rejects five uses', () => {
    expect(issuesOf({ ...valid, uses: [...valid.uses, ...valid.uses].slice(0, 5) })).toEqual([
      { code: 'too_big', path: ['uses'] },
    ]);
  });

  it('rejects an empty whenNot', () => {
    expect(issuesOf({ ...valid, whenNot: '' })).toEqual([{ code: 'too_small', path: ['whenNot'] }]);
  });

  it('accepts a Step without a keyIdea and rejects an empty one', () => {
    const step = { title: 't', caption: 'c' };
    expect(issuesOf({ ...valid, steps: { 'the-problem': step } })).toEqual([]);
    expect(issuesOf({ ...valid, steps: { 'the-problem': { ...step, keyIdea: '' } } })).toEqual([
      { code: 'too_small', path: ['steps', 'the-problem', 'keyIdea'] },
    ]);
  });

  it('stays in step with LessonMessages', () => {
    const asSchemaType: z.infer<typeof lessonMessagesSchema> = valid;
    const asMessages: LessonMessages = lessonMessagesSchema.parse(valid);
    expect([asSchemaType, asMessages]).toEqual([valid, valid]);
  });
});

describe('exerciseMessagesSchema', () => {
  const exercise = { title: 'Second number', task: 'Return it.', hints: ['One', 'Two'] };

  it('accepts exercise messages unchanged', () => {
    expect(exerciseMessagesSchema.parse(exercise)).toEqual(exercise);
  });

  it('accepts lesson messages carrying an exercise', () => {
    expect(lessonMessagesSchema.parse({ ...valid, exercise })).toEqual({ ...valid, exercise });
  });

  it('rejects an unknown key', () => {
    expect(
      exerciseMessagesSchema
        .safeParse({ ...exercise, extra: 'x' })
        .error?.issues.map(({ code, path }) => ({ code, path })),
    ).toEqual([{ code: 'unrecognized_keys', path: [] }]);
  });

  it('rejects an empty title, task and hint', () => {
    const result = exerciseMessagesSchema.safeParse({ title: '', task: '', hints: [''] });
    expect(result.error?.issues.map(({ code, path }) => ({ code, path }))).toEqual([
      { code: 'too_small', path: ['title'] },
      { code: 'too_small', path: ['task'] },
      { code: 'too_small', path: ['hints', 0] },
    ]);
  });

  it('rejects hints that are not an array', () => {
    const result = exerciseMessagesSchema.safeParse({ ...exercise, hints: 'One' });
    expect(result.error?.issues.map(({ code, path }) => ({ code, path }))).toEqual([
      { code: 'invalid_type', path: ['hints'] },
    ]);
  });

  it('stays in step with ExerciseMessages', () => {
    const asSchemaType: z.infer<typeof exerciseMessagesSchema> = exercise;
    const asMessages: ExerciseMessages = exerciseMessagesSchema.parse(exercise);
    expect([asSchemaType, asMessages]).toEqual([exercise, exercise]);
  });
});
