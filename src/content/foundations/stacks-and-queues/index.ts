import type { LessonContent } from '../../types';
import en from './en.json';
import { isBalancedExercise } from './exercise';
import { stacksAndQueuesLesson } from './lesson';
import pl from './pl.json';

export const stacksAndQueuesContent: LessonContent = {
  module: 'foundations',
  lesson: stacksAndQueuesLesson,
  terms: ['stack', 'push', 'pop', 'queue', 'enqueue', 'dequeue'],
  exercise: isBalancedExercise,
  messages: { en, pl },
};
