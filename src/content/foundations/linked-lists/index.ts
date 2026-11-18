import type { LessonContent } from '../../types';
import en from './en.json';
import { linkedListsLesson } from './lesson';
import pl from './pl.json';

export const linkedListsContent: LessonContent = {
  module: 'foundations',
  lesson: linkedListsLesson,
  terms: ['linked-list', 'node', 'head', 'pointer', 'traversal'],
  messages: { en, pl },
};
