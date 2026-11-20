import type { LessonContent } from '../../types';
import en from './en.json';
import { totalSizeExercise } from './exercise';
import { recursionLesson } from './lesson';
import pl from './pl.json';

export const recursionContent: LessonContent = {
  module: 'searching-and-recursion',
  lesson: recursionLesson,
  terms: ['recursion', 'call-stack', 'base-case', 'recursive-case', 'stack-overflow'],
  exercise: totalSizeExercise,
  messages: { en, pl },
};
