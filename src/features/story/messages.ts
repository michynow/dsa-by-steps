import type { MessageBundle } from '@/features/locale';
import en from './messages/en.json';
import pl from './messages/pl.json';

export type StoryMessages = typeof en;

export const storyMessages: MessageBundle<StoryMessages> = { en, pl };
