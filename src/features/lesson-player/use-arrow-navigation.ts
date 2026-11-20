import { useContext, useEffect, useLayoutEffect, useRef } from 'react';
import { UNSAFE_DataRouterContext } from 'react-router';
import type { CoursePosition } from '@/domain';
import { useProgress } from '@/features/progress';
import { arrowTarget } from './arrow-target';
import { isKeyOwnedByControl } from './key-ownership';
import { pathOf, positionOfPath } from './step-paths';
import type { NavigationInput } from './use-step-navigation';

function hasModifier(event: KeyboardEvent): boolean {
  return event.altKey || event.ctrlKey || event.metaKey || event.shiftKey;
}

function isIgnored(event: KeyboardEvent): boolean {
  return (
    event.defaultPrevented || hasModifier(event) || isKeyOwnedByControl(event.target, event.key)
  );
}

function pathOfQueued(queued: CoursePosition | null, input: NavigationInput): string | undefined {
  return queued === null ? undefined : pathOf(input.course, input.locale, queued);
}

export function useArrowNavigation(input: NavigationInput, go: (path: string) => void): void {
  const progress = useProgress((current) => current);
  const latest = useRef({ input, go, progress });
  const router = useContext(UNSAFE_DataRouterContext)?.router;
  const pending = useRef<CoursePosition | null>(null);

  useLayoutEffect(() => {
    latest.current = { input, go, progress };
  });

  useEffect(
    () =>
      router?.subscribe((state) => {
        if (state.location.pathname !== pathOfQueued(pending.current, latest.current.input)) {
          pending.current = null;
        }
      }),
    [router],
  );

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      if (isIgnored(event)) return;
      const { input: current, go: navigate, progress: stored } = latest.current;
      const pathname = router?.state.location.pathname ?? '';
      const base = pending.current ?? positionOfPath(current.course, pathname) ?? current.position;
      const target = arrowTarget(event.key, current, stored, base);
      const path = target && pathOf(current.course, current.locale, target);
      if (target === undefined || path === undefined) return;
      pending.current = target;
      navigate(path);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [router]);
}
