import type { ReactNode } from 'react';
import type { CheckMessages } from '@/content';
import type { Check, LessonKey } from '@/domain';
import type { SceneSelection } from '@/renderer';
import { CheckPanel } from './CheckPanel';
import { useCheckSession } from './use-check-session';

export interface StepCheckBinding {
  readonly settled: boolean;
  readonly selection: SceneSelection | undefined;
  readonly panel: ReactNode;
}

export function useStepCheckBinding(
  lesson: LessonKey,
  check: Check,
  messages: CheckMessages,
): StepCheckBinding {
  const session = useCheckSession(lesson, check);
  return {
    settled: session.settled,
    selection: session.selection,
    panel: <CheckPanel session={session} messages={messages} />,
  };
}
