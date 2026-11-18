import type { RouteObject } from 'react-router';
import { LocaleRoute, RootRedirect } from '@/features/locale';
import { CourseHome } from './CourseHome';
import { Shell } from './Shell';

export const routes: RouteObject[] = [
  { path: '/', Component: RootRedirect },
  {
    path: ':locale',
    Component: LocaleRoute,
    children: [{ Component: Shell, children: [{ index: true, Component: CourseHome }] }],
  },
  { path: '*', Component: RootRedirect },
];
