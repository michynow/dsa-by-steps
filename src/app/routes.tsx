import type { RouteObject } from 'react-router';
import type { ModuleContent } from '@/content';
import { useStepCheckBinding } from '@/features/checks';
import { LocaleRoute, RootRedirect } from '@/features/locale';
import { PracticeDetail, PracticePage, PracticeRedirect } from '@/features/practice';
import { LessonError, LessonPage, LessonRedirect } from '@/features/lesson-player';
import type { UseStepCheck } from '@/features/lesson-player';
import { CourseHome } from './CourseHome';
import { Shell } from './Shell';

export interface RouteDependencies {
  readonly modules: readonly ModuleContent[];
  readonly useStepCheck?: UseStepCheck;
}

export function createRoutes({
  modules,
  useStepCheck = useStepCheckBinding,
}: RouteDependencies): RouteObject[] {
  return [
    { path: '/', Component: RootRedirect },
    {
      path: ':locale',
      Component: LocaleRoute,
      children: [
        {
          element: <Shell modules={modules} />,
          children: [
            {
              errorElement: <LessonError />,
              children: [
                { index: true, element: <CourseHome modules={modules} /> },
                { path: 'practice', element: <PracticePage modules={modules} /> },
                {
                  path: 'practice/:module/:lesson',
                  element: <PracticeDetail modules={modules} />,
                },
                { path: 'practice/*', element: <PracticeRedirect /> },
                { path: ':module/:lesson/code', element: <PracticeRedirect /> },
                { path: ':module/:lesson', element: <LessonRedirect modules={modules} /> },
                {
                  path: ':module/:lesson/:step',
                  element: <LessonPage modules={modules} useStepCheck={useStepCheck} />,
                },
              ],
            },
          ],
        },
      ],
    },
    { path: '*', Component: RootRedirect },
  ];
}
