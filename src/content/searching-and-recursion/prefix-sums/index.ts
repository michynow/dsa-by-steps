import type { LessonContent } from '../../types';
import en from './en.json';
import { rangeTotalsExercise } from './exercise';
import { prefixSumsLesson } from './lesson';
import pl from './pl.json';

export const prefixSumsContent: LessonContent = {
  module: 'searching-and-recursion',
  lesson: prefixSumsLesson,
  terms: ['prefix-sum', 'constant-time'],
  exercise: rangeTotalsExercise,
  messages: { en, pl },
};
