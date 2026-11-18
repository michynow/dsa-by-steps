import { z } from 'zod';

const text = z.string().min(1);

const stepMessages = z.strictObject({ title: text, caption: text });

const checkMessages = z.strictObject({
  prompt: text,
  options: z.record(z.string(), text).optional(),
  explanation: text,
});

const termMessages = z.strictObject({ term: text, gloss: text });

export const lessonMessagesSchema = z.strictObject({
  title: text,
  outcomes: z.record(z.string(), text),
  steps: z.record(z.string(), stepMessages),
  checks: z.record(z.string(), checkMessages),
  terms: z.record(z.string(), termMessages),
});
