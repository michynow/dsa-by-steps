import type { ReactNode } from 'react';
import type { Check, LessonKey } from '@/domain';
import type { CheckMessages } from '@/content';
import type { SceneSelection } from '@/renderer';

export interface StepCheckBinding {
  readonly settled: boolean;
  readonly selection: SceneSelection | undefined;
  readonly panel: ReactNode;
}

export type UseStepCheck = (
  lesson: LessonKey,
  check: Check,
  messages: CheckMessages,
) => StepCheckBinding;

export const uncheckedStep: StepCheckBinding = {
  settled: true,
  selection: undefined,
  panel: null,
};

export const noStepCheck: UseStepCheck = () => uncheckedStep;
