import { useCallback, useRef, useState } from 'react';
import type { ReactElement } from 'react';
import type { TermMessages } from '@/content';
import { useMessages } from '@/features/locale';
import { termsMessages } from './messages';
import styles from './TermChip.module.css';
import { usePopoverDismiss } from './use-popover-dismiss';

export interface TermChipProps {
  readonly term: TermMessages;
  readonly isNew: boolean;
}

export function TermChip({ term, isNew }: TermChipProps): ReactElement {
  const messages = useMessages(termsMessages);
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLSpanElement>(null);
  const chip = useRef<HTMLButtonElement>(null);
  const close = useCallback(() => {
    setOpen(false);
  }, []);
  const closeAndRefocus = useCallback(() => {
    setOpen(false);
    chip.current?.focus();
  }, []);
  usePopoverDismiss(open, root, close, closeAndRefocus);
  return (
    <span ref={root} className={styles.root}>
      <button
        ref={chip}
        type="button"
        className={styles.chip}
        aria-expanded={open}
        onClick={() => {
          setOpen(!open);
        }}
      >
        {term.term}
        {isNew ? (
          <>
            {' '}
            <span className={styles.new}>{messages.new}</span>
          </>
        ) : null}
      </button>
      {open ? (
        <span role="note" className={styles.popover}>
          <strong className={styles.name}>{term.term}</strong> {term.gloss}
        </span>
      ) : null}
    </span>
  );
}
