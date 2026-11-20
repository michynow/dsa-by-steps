import type { LessonContent } from '../../types';
import en from './en.json';
import { twoSumSortedExercise } from './exercise';
import { arraysAndTwoPointersLesson } from './lesson';
import pl from './pl.json';

export const arraysAndTwoPointersContent: LessonContent = {
  module: 'foundations',
  lesson: arraysAndTwoPointersLesson,
  terms: ['array', 'index', 'two-pointers', 'pointer'],
  exercise: twoSumSortedExercise,
  messages: { en, pl },
};
