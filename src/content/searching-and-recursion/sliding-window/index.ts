import type { LessonContent } from '../../types';
import en from './en.json';
import { busiestWindowExercise } from './exercise';
import { slidingWindowLesson } from './lesson';
import pl from './pl.json';

export const slidingWindowContent: LessonContent = {
  module: 'searching-and-recursion',
  lesson: slidingWindowLesson,
  terms: ['sliding-window', 'variable-window', 'linear-time'],
  exercise: busiestWindowExercise,
  messages: { en, pl },
};
