import type { CheckMessages } from '@/content';
import type { Check } from '@/domain';

export const placeholderCheck: Check = { kind: 'choice', id: '', options: [], correct: '' };

export const placeholderCheckMessages: CheckMessages = { prompt: '', explanation: '' };
