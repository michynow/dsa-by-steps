import { z } from 'zod';

const text = z.string().min(1);

const stepMessages = z.strictObject({
  title: text,
  caption: text,
  keyIdea: z.exactOptional(text),
});

const story = z.strictObject({ title: text, summary: text });

const use = z.strictObject({ title: text, body: text });

const checkMessages = z.strictObject({
  prompt: text,
  options: z.exactOptional(z.record(z.string(), text)),
  explanation: text,
});

const termMessages = z.strictObject({ term: text, gloss: text });

export const exerciseMessagesSchema = z.strictObject({
  title: text,
  task: text,
  hints: z.array(text).readonly(),
});

export const lessonMessagesSchema = z.strictObject({
  title: text,
  story,
  uses: z.array(use).min(3).max(4).readonly(),
  whenNot: text,
  outcomes: z.record(z.string(), text),
  steps: z.record(z.string(), stepMessages),
  checks: z.record(z.string(), checkMessages),
  terms: z.record(z.string(), termMessages),
  exercise: z.exactOptional(exerciseMessagesSchema),
});
