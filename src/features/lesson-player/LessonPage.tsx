import { useMemo } from 'react';
import type { ReactElement } from 'react';
import { Navigate, useParams } from 'react-router';
import { courseOf } from '@/content';
import type { ModuleContent } from '@/content';
import { LessonView } from './LessonView';
import { findLesson } from './find-lesson';
import { stepIndexOf } from './step-route';
import type { UseStepCheck } from './step-check';

export interface LessonPageProps {
  readonly modules: readonly ModuleContent[];
  readonly useStepCheck: UseStepCheck;
}

export function LessonPage({ modules, useStepCheck }: LessonPageProps): ReactElement {
  const { locale = '', module = '', lesson = '', step } = useParams();
  const course = useMemo(() => courseOf(modules), [modules]);
  const content = findLesson(modules, module, lesson);
  const index = content === undefined ? undefined : stepIndexOf(step, content.lesson);
  if (content === undefined || index === undefined) return <Navigate to={`/${locale}`} replace />;
  return <LessonView course={course} content={content} step={index} useStepCheck={useStepCheck} />;
}
