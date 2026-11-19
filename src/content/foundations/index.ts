import type { ModuleContent } from '../types';
import en from './en.json';
import { hashMapsContent } from './hash-maps';
import { linkedListsContent } from './linked-lists';
import pl from './pl.json';

export const foundations: ModuleContent = {
  slug: 'foundations',
  titles: { en: en.title, pl: pl.title },
  lessons: [linkedListsContent, hashMapsContent],
};
