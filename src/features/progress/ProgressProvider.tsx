import type { ReactElement, ReactNode } from 'react';
import { ProgressContext } from './progress-context';
import type { ProgressStore } from './progress-store';

export function ProgressProvider(props: {
  readonly store: ProgressStore;
  readonly children: ReactNode;
}): ReactElement {
  return <ProgressContext value={props.store}>{props.children}</ProgressContext>;
}
