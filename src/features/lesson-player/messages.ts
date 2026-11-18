import type { MessageBundle } from '@/features/locale';
import en from './messages/en.json';
import pl from './messages/pl.json';

export type LessonPlayerMessages = typeof en;

export const lessonPlayerMessages: MessageBundle<LessonPlayerMessages> = { en, pl };
