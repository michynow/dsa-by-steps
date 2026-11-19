import { useEffect } from 'react';
import type { RefObject } from 'react';

export function usePopoverDismiss(
  open: boolean,
  root: RefObject<HTMLElement | null>,
  onOutside: () => void,
  onEscape: () => void,
): void {
  useEffect(() => {
    if (!open) return undefined;
    const outside = (event: Event): void => {
      if (event.target instanceof Node && root.current?.contains(event.target) !== true) {
        onOutside();
      }
    };
    const escape = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') onEscape();
    };
    document.addEventListener('pointerdown', outside);
    document.addEventListener('focusin', outside);
    document.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('pointerdown', outside);
      document.removeEventListener('focusin', outside);
      document.removeEventListener('keydown', escape);
    };
  }, [open, root, onOutside, onEscape]);
}
