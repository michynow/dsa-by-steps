import type { Locale } from '@/domain';

export function practiceIndexPath(locale: Locale): string {
  return `/${locale}/practice`;
}

export function practicePath(locale: Locale, module: string, lesson: string): string {
  return `${practiceIndexPath(locale)}/${module}/${lesson}`;
}
