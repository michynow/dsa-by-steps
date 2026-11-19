import type { ReactElement } from 'react';
import { Navigate, useParams } from 'react-router';
import type { ModuleContent } from '@/content';
import { findLesson } from './find-lesson';
import { segmentOf } from './step-route';

export function LessonRedirect({
  modules,
}: {
  readonly modules: readonly ModuleContent[];
}): ReactElement {
  const { locale = '', module = '', lesson = '' } = useParams();
  const content = findLesson(modules, module, lesson);
  if (content === undefined) return <Navigate to={`/${locale}`} replace />;
  return <Navigate to={`/${locale}/${module}/${lesson}/${segmentOf(0)}`} replace />;
}
