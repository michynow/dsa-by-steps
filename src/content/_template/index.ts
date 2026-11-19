import type { LessonContent } from '../types';
import en from './en.json';
import { templateExercise } from './exercise';
import { templateLesson } from './lesson';
import pl from './pl.json';

export const templateContent: LessonContent = {
  module: 'template-module',
  lesson: templateLesson,
  terms: ['array'],
  exercise: templateExercise,
  messages: { en, pl },
};
