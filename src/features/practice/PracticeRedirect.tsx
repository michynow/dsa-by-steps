import type { ReactElement } from 'react';
import { Navigate, useParams } from 'react-router';
import { useLocale } from '@/features/locale';
import { practiceIndexPath, practicePath } from './practice-paths';

export function PracticeRedirect(): ReactElement {
  const locale = useLocale();
  const { module, lesson } = useParams();
  const to =
    module === undefined || lesson === undefined
      ? practiceIndexPath(locale)
      : practicePath(locale, module, lesson);
  return <Navigate to={to} replace />;
}
