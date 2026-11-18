import { useContext, useEffect, useLayoutEffect, useRef } from 'react';
import { UNSAFE_DataRouterContext } from 'react-router';
import type { CoursePosition } from '@/domain';
import { useProgress } from '@/features/progress';
import { arrowTarget } from './arrow-target';
import { pathOf, positionOfPath, samePosition } from './step-paths';
import type { NavigationInput } from './use-step-navigation';

const ownedByControl =
  'input, textarea, select, [contenteditable], [role="radiogroup"], [role="radio"], [role="textbox"], [data-stage] button';

function isOwnedByControl(target: EventTarget | null): boolean {
  return target instanceof Element && target.closest(ownedByControl) !== null;
}

function hasModifier(event: KeyboardEvent): boolean {
  return event.altKey || event.ctrlKey || event.metaKey || event.shiftKey;
}

function isIgnored(event: KeyboardEvent): boolean {
  return event.defaultPrevented || hasModifier(event) || isOwnedByControl(event.target);
}

export function useArrowNavigation(input: NavigationInput, go: (path: string) => void): void {
  const progress = useProgress((current) => current);
  const latest = useRef({ input, go, progress });
  const router = useContext(UNSAFE_DataRouterContext)?.router;
  const pending = useRef<CoursePosition | null>(null);
  const rendered = useRef(input.position);

  useLayoutEffect(() => {
    latest.current = { input, go, progress };
    if (!samePosition(rendered.current, input.position)) pending.current = null;
    rendered.current = input.position;
  });

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      if (isIgnored(event)) return;
      const { input: current, go: navigate, progress: stored } = latest.current;
      const live = positionOfPath(current.course, router?.state.location.pathname ?? '');
      const base = pending.current ?? live ?? current.position;
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
