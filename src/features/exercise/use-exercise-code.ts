import { useCallback, useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';
import type { LessonKey } from '@/domain';
import { useProgress, useProgressActions } from '@/features/progress';

const saveDelayMs = 500;

export interface ExerciseCode {
  readonly initial: string;
  readonly latest: RefObject<string>;
  readonly edit: (code: string) => void;
}

export function useExerciseCode(lesson: LessonKey, starterCode: string): ExerciseCode {
  const saved = useProgress((progress) => progress.exercises[lesson]?.code);
  const actions = useProgressActions();
  const [initial] = useState(() => (saved === undefined || saved === '' ? starterCode : saved));
  const latest = useRef(initial);
  const timer = useRef<number | undefined>(undefined);

  const edit = useCallback(
    (code: string) => {
      latest.current = code;
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => {
        timer.current = undefined;
        actions.saveExerciseCode(lesson, code);
      }, saveDelayMs);
    },
    [lesson, actions],
  );

  useEffect(
    () => () => {
      if (timer.current === undefined) return;
      window.clearTimeout(timer.current);
      actions.saveExerciseCode(lesson, latest.current);
    },
    [lesson, actions],
  );

  return { initial, latest, edit };
}
