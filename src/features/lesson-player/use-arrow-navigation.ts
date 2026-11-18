import { useEffect } from 'react';
import type { StepNavigation } from './step-navigation';

const ownedByControl =
  'input, textarea, select, [contenteditable], [role="radiogroup"], [role="radio"], [role="textbox"], [data-stage] button';

function isOwnedByControl(target: EventTarget | null): boolean {
  return target instanceof Element && target.closest(ownedByControl) !== null;
}

function hasModifier(event: KeyboardEvent): boolean {
  return event.altKey || event.ctrlKey || event.metaKey || event.shiftKey;
}

export function useArrowNavigation({
  previousPath,
  nextPath,
  nextBlocked,
  go,
}: StepNavigation): void {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.defaultPrevented || hasModifier(event) || isOwnedByControl(event.target)) return;
      if (event.key === 'ArrowLeft' && previousPath !== undefined) go(previousPath);
      if (event.key === 'ArrowRight' && nextPath !== undefined && !nextBlocked) go(nextPath);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [previousPath, nextPath, nextBlocked, go]);
}
