import { useLayoutEffect } from 'react';
import type { RefObject } from 'react';

const edgeMargin = 16;

function shiftOf(left: number, right: number): number {
  const over = right - (window.innerWidth - edgeMargin);
  return over > 0 ? -over : Math.max(0, edgeMargin - left);
}

export function useViewportShift(open: boolean, popover: RefObject<HTMLElement | null>): void {
  useLayoutEffect(() => {
    const element = popover.current;
    if (!open || element === null) return;
    element.style.marginLeft = '';
    const { left, right } = element.getBoundingClientRect();
    const shift = shiftOf(left, right);
    element.style.marginLeft = shift === 0 ? '' : `${String(shift)}px`;
  }, [open, popover]);
}
