import type { MessageBundle } from '@/features/locale';
import en from './messages/en.json';
import pl from './messages/pl.json';

export type TermsMessages = typeof en;

export const termsMessages: MessageBundle<TermsMessages> = { en, pl };
