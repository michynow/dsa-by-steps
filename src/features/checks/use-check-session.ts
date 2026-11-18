import { useEffect, useRef, useState } from 'react';
import { canReveal, checkKey, checkStateOf, judge, recordVerdict, reveal } from '@/domain';
import type {
  Answer,
  Check,
  CheckKey,
  CheckState,
  ElementRef,
  LessonKey,
  OptionId,
  Verdict,
} from '@/domain';
import type { SceneSelection } from '@/renderer';
import { useProgress, useProgressActions } from '../progress';

export interface CheckSession {
  readonly check: Check;
  readonly state: CheckState;
  readonly settled: boolean;
  readonly lastVerdict: Verdict | null;
  readonly pending: ElementRef | OptionId | null;
  readonly selection: SceneSelection | undefined;
  choose(option: OptionId): void;
  select(target: ElementRef): void;
  submit(): void;
  reveal(): void;
}

interface Local {
  readonly key: CheckKey;
  readonly pending: ElementRef | OptionId | null;
  readonly lastVerdict: Verdict | null;
}

const blank = (key: CheckKey): Local => ({ key, pending: null, lastVerdict: null });

function answerOf(check: Check, pending: Local['pending']): Answer | null {
  if (pending === null) return null;
  if (check.kind === 'choice' && typeof pending === 'string') {
    return { kind: 'choice', option: pending };
  }
  if (check.kind === 'predict' && typeof pending !== 'string') {
    return { kind: 'predict', target: pending };
  }
  return null;
}

function selectionOf(
  check: Check,
  settled: boolean,
  pending: Local['pending'],
  onSelect: (ref: ElementRef) => void,
): SceneSelection | undefined {
  if (check.kind !== 'predict') return undefined;
  if (settled) return { selected: check.correct, onSelect };
  return { selected: typeof pending === 'string' ? null : pending, onSelect };
}

export function useCheckSession(lesson: LessonKey, check: Check): CheckSession {
  const key = checkKey(lesson, check.id);
  const state = useProgress((progress) => checkStateOf(progress, key));
  const actions = useProgressActions();
  const [stored, setLocal] = useState<Local>(blank(key));
  const local = stored.key === key ? stored : blank(key);
  const current = useRef(state);
  const submitted = useRef(false);

  useEffect(() => {
    current.current = state;
  }, [state]);

  const settled = check.kind === 'order' || state.status !== 'open';
  const editable = check.kind !== 'order' && current.current.status === 'open';

  const change = (pending: Local['pending']): void => {
    submitted.current = false;
    setLocal({ key, pending, lastVerdict: local.lastVerdict });
  };

  const write = (next: CheckState): void => {
    current.current = next;
    actions.setCheckState(key, next);
  };

  const choose = (option: OptionId): void => {
    if (editable && check.kind === 'choice') change(option);
  };

  const select = (target: ElementRef): void => {
    if (editable && check.kind === 'predict') change(target);
  };

  const submit = (): void => {
    const answer = answerOf(check, local.pending);
    if (!editable || answer === null || submitted.current) return;
    const verdict = judge(check, answer);
    if (!verdict.ok) return;
    const next = recordVerdict(current.current, verdict.value);
    if (!next.ok) return;
    submitted.current = true;
    write(next.value);
    setLocal({ ...local, lastVerdict: verdict.value });
  };

  const revealAnswer = (): void => {
    if (!editable || !canReveal(current.current)) return;
    const next = reveal(current.current);
    if (next.ok) write(next.value);
  };

  return {
    check,
    state,
    settled,
    lastVerdict: local.lastVerdict,
    pending: local.pending,
    selection: selectionOf(check, settled, local.pending, select),
    choose,
    select,
    submit,
    reveal: revealAnswer,
  };
}
