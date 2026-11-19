import { parseCaption, termIntroductions } from './caption';
import type { LessonContent, LessonMessages } from './types';
import { templateContent } from './_template';

describe('parseCaption', () => {
  it('keeps plain text as one text segment', () => {
    expect(parseCaption('Just words.')).toEqual([{ kind: 'text', text: 'Just words.' }]);
  });

  it('turns one marker into a term segment', () => {
    expect(parseCaption('A [[linked-list]] grows.')).toEqual([
      { kind: 'text', text: 'A ' },
      { kind: 'term', term: 'linked-list' },
      { kind: 'text', text: ' grows.' },
    ]);
  });

  it('turns two adjacent markers into two term segments', () => {
    expect(parseCaption('[[head]][[node]]')).toEqual([
      { kind: 'term', term: 'head' },
      { kind: 'term', term: 'node' },
    ]);
  });

  it('handles a term at the start and at the end', () => {
    expect(parseCaption('[[head]] then [[node]]')).toEqual([
      { kind: 'term', term: 'head' },
      { kind: 'text', text: ' then ' },
      { kind: 'term', term: 'node' },
    ]);
  });

  it('keeps an unclosed marker as text', () => {
    expect(parseCaption('see [[head and more')).toEqual([
      { kind: 'text', text: 'see [[head and more' },
    ]);
  });

  it('keeps an invalid id as text and merges it with its neighbours', () => {
    expect(parseCaption('a [[Bad Id]] b [x] c [[head]]')).toEqual([
      { kind: 'text', text: 'a [[Bad Id]] b [x] c ' },
      { kind: 'term', term: 'head' },
    ]);
  });

  it('keeps an underscore id and an uppercase id as text', () => {
    expect(parseCaption('a [[Bad_Id]] b [[Head]]')).toEqual([
      { kind: 'text', text: 'a [[Bad_Id]] b [[Head]]' },
    ]);
  });

  it('returns no segments for an empty string', () => {
    expect(parseCaption('')).toEqual([]);
  });
});

const en = templateContent.messages.en;

function withEnSteps(steps: LessonMessages['steps'], terms: readonly string[]): LessonContent {
  return {
    ...templateContent,
    terms,
    messages: { ...templateContent.messages, en: { ...en, steps } },
  };
}

describe('termIntroductions', () => {
  it('maps each Term to the first Step in Step order that marks it, including a Key Idea', () => {
    const content = withEnSteps(
      {
        'how-it-works': { title: 't', caption: 'late [[array]] and [[cell]]' },
        'the-problem': { title: 't', caption: 'plain', keyIdea: 'keep the [[array]]' },
      },
      ['array', 'cell', 'unseen'],
    );
    expect(termIntroductions(content)).toEqual({
      array: 'the-problem',
      cell: 'how-it-works',
    });
  });
});
