import type { LessonContent } from '../types';
import en from './en.json';
import { templateLesson } from './lesson';
import pl from './pl.json';

export const templateContent: LessonContent = {
  module: 'template-module',
  lesson: templateLesson,
  terms: ['array'],
  messages: { en, pl },
};
