import type { LessonContent } from '../../types';
import en from './en.json';
import { firstDuplicateExercise } from './exercise';
import { hashMapsLesson } from './lesson';
import pl from './pl.json';

export const hashMapsContent: LessonContent = {
  module: 'foundations',
  lesson: hashMapsLesson,
  terms: ['hash-map', 'bucket', 'hash-function', 'collision'],
  exercise: firstDuplicateExercise,
  messages: { en, pl },
};
