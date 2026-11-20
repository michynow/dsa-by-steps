import type { LessonContent } from '../../types';
import en from './en.json';
import { firstCommitAtOrAfterExercise } from './exercise';
import { binarySearchLesson } from './lesson';
import pl from './pl.json';

export const binarySearchContent: LessonContent = {
  module: 'searching-and-recursion',
  lesson: binarySearchLesson,
  terms: ['binary-search', 'loop-invariant', 'logarithmic-time'],
  exercise: firstCommitAtOrAfterExercise,
  messages: { en, pl },
};
