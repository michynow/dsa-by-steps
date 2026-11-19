import type { MessageBundle } from '@/features/locale';
import en from './messages/en.json';
import pl from './messages/pl.json';

export type ExerciseMessages = typeof en;

export const exerciseMessages: MessageBundle<ExerciseMessages> = { en, pl };
