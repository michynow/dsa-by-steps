import type { LessonContent } from '../../types';
import en from './en.json';
import { reverseListExercise } from './exercise';
import { linkedListsLesson } from './lesson';
import pl from './pl.json';

export const linkedListsContent: LessonContent = {
  module: 'foundations',
  lesson: linkedListsLesson,
  terms: ['linked-list', 'node', 'head', 'pointer', 'traversal'],
  exercise: reverseListExercise,
  messages: { en, pl },
};
