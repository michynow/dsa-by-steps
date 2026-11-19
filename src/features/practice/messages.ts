import type { MessageBundle } from '@/features/locale';
import en from './messages/en.json';
import pl from './messages/pl.json';

export type PracticeMessages = typeof en;

export const practiceMessages: MessageBundle<PracticeMessages> = { en, pl };
