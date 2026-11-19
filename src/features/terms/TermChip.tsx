import { useCallback, useId, useRef, useState } from 'react';
import type { ReactElement } from 'react';
import type { TermMessages } from '@/content';
import { useMessages } from '@/features/locale';
import { termsMessages } from './messages';
import styles from './TermChip.module.css';
import { usePopoverDismiss } from './use-popover-dismiss';
import { useViewportShift } from './use-viewport-shift';

export interface TermChipProps {
  readonly term: TermMessages;
  readonly isNew: boolean;
}

export function TermChip({ term, isNew }: TermChipProps): ReactElement {
  const messages = useMessages(termsMessages);
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLSpanElement>(null);
  const chip = useRef<HTMLButtonElement>(null);
  const popover = useRef<HTMLSpanElement>(null);
  const popoverId = useId();
  const newId = useId();
  const close = useCallback(() => {
    setOpen(false);
  }, []);
  const closeAndRefocus = useCallback(() => {
    setOpen(false);
    chip.current?.focus();
  }, []);
  usePopoverDismiss(open, root, close, closeAndRefocus);
  useViewportShift(open, popover);
  const describedBy = [isNew ? newId : '', open ? popoverId : ''].filter(Boolean).join(' ');
  return (
    <span ref={root} className={styles.root}>
      <button
        ref={chip}
        type="button"
        className={styles.chip}
        aria-expanded={open}
        aria-controls={open ? popoverId : undefined}
        aria-describedby={describedBy === '' ? undefined : describedBy}
        onClick={() => {
          setOpen(!open);
        }}
      >
        {term.term}
        {isNew ? (
          <>
            {' '}
            <span className={styles.new} aria-hidden="true">
              {messages.new}
            </span>
          </>
        ) : null}
      </button>
      {isNew ? (
        <span id={newId} hidden>
          {messages.newTerm}
        </span>
      ) : null}
      {open ? (
        <span ref={popover} id={popoverId} className={styles.popover}>
          <strong className={styles.name}>{term.term}</strong> {term.gloss}
        </span>
      ) : null}
    </span>
  );
}
