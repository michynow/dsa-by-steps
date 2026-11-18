import type { ModuleContent } from '../types';
import en from './en.json';
import { linkedListsContent } from './linked-lists';
import pl from './pl.json';

export const foundations: ModuleContent = {
  slug: 'foundations',
  titles: { en: en.title, pl: pl.title },
  lessons: [linkedListsContent],
};
