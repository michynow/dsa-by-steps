import { testModules } from './lesson-fixtures';

const markedMessages = (prefix: string) => ({
  title: `${prefix}Stacks`,
  story: { title: `${prefix}Story`, summary: `${prefix}Story of a [[stack]]` },
  uses: [
    { title: `${prefix}Undo`, body: `${prefix}Editors keep a [[stack]]` },
    { title: `${prefix}Calls`, body: `${prefix}Calls form a [[stack]]` },
  ],
  whenNot: `${prefix}Not for random access to a [[stack]]`,
  outcomes: { o1: `${prefix}Push and pop` },
  steps: {
    why: {
      title: `${prefix}Why stacks`,
      caption: `${prefix}A [[stack]] holds things, a [[stack]]`,
    },
    push: {
      title: `${prefix}Push one`,
      caption: `${prefix}Push onto the [[stack]]`,
      keyIdea: `${prefix}Keep the [[stack]] in mind`,
    },
    pop: { title: `${prefix}Pop one`, caption: `${prefix}Pop it from the [[top]]` },
  },
  checks: {
    'c-push': {
      prompt: `${prefix}Where does it go?`,
      options: { a: 'on top', b: 'below' },
      explanation: `${prefix}On top.`,
    },
  },
  terms: {
    stack: { term: 'stack', gloss: `${prefix}last in, first out` },
    top: { term: 'top', gloss: `${prefix}the open end` },
  },
});

export const markedModules = testModules.map((module) => ({
  ...module,
  lessons: module.lessons.map((content) =>
    content.lesson.slug === 'stacks'
      ? {
          ...content,
          terms: ['stack', 'top'],
          messages: { en: markedMessages(''), pl: markedMessages('PL ') },
        }
      : content,
  ),
}));
