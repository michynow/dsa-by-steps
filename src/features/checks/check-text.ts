import type { MessageBundle } from '../locale';
import en from './messages/en.json';
import pl from './messages/pl.json';

export interface CheckText {
  readonly submit: string;
  readonly reveal: string;
  readonly emptyChoice: string;
  readonly emptyPredict: string;
  readonly predictHint: string;
  readonly miss: string;
  readonly passed: string;
  readonly revealed: string;
  readonly correctOption: string;
}

export const checkText: MessageBundle<CheckText> = { en, pl };
