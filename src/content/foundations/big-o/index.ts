import type { LessonContent } from '../../types';
import en from './en.json';
import { countPairsWithSumExercise } from './exercise';
import { bigOLesson } from './lesson';
import pl from './pl.json';

export const bigOContent: LessonContent = {
  module: 'foundations',
  lesson: bigOLesson,
  terms: ['big-o', 'constant-time', 'linear-time', 'quadratic-time'],
  exercise: countPairsWithSumExercise,
  messages: { en, pl },
};
