import type { ModuleContent } from '../types';
import { binarySearchContent } from './binary-search';
import en from './en.json';
import pl from './pl.json';

export const searchingAndRecursion: ModuleContent = {
  slug: 'searching-and-recursion',
  titles: { en: en.title, pl: pl.title },
  lessons: [binarySearchContent],
};
