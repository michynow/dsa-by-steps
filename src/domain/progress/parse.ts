import { z } from 'zod';
import { err, ok } from '../result';
import type { Result } from '../result';
import { currentProgressVersion } from './types';
import type { Progress, ProgressError } from './types';

const slug = '[a-z0-9]+(?:-[a-z0-9]+)*';
const slugPattern = new RegExp(`^${slug}$`);
const stepIdSchema = z.string().regex(slugPattern, 'invalid step id');
const stepIdsSchema = z
  .array(stepIdSchema)
  .refine((ids) => new Set(ids).size === ids.length, 'duplicate step ids');
const count = z.number().int().nonnegative();
const lessonKeySchema = z.string().regex(new RegExp(`^${slug}/${slug}$`), 'invalid lesson key');
const checkKeySchema = z
  .string()
  .regex(new RegExp(`^${slug}/${slug}/${slug}$`), 'invalid check key');

export const progressSchema = z.object({
  version: z.literal(currentProgressVersion),
  stepsSeen: z.record(lessonKeySchema, stepIdsSchema),
  checks: z.record(
    checkKeySchema,
    z.object({ misses: count, status: z.enum(['open', 'passed', 'revealed']) }),
  ),
  exercises: z.record(
    lessonKeySchema,
    z.object({ code: z.string(), hintsTaken: count, rejections: count, passed: z.boolean() }),
  ),
});

export type Migration = (older: Readonly<Record<string, unknown>>) => Record<string, unknown>;
export type MigrationChain = Readonly<Record<number, Migration>>;

const migrations: MigrationChain = {};

function isRecord(input: unknown): input is Readonly<Record<string, unknown>> {
  return typeof input === 'object' && input !== null && !Array.isArray(input);
}

function unsupported(version: unknown): Result<never, ProgressError> {
  return err({ code: 'unsupported-version', version });
}

function migrate(
  stored: Readonly<Record<string, unknown>>,
  chain: MigrationChain,
): Result<Readonly<Record<string, unknown>>, ProgressError> {
  const version = stored['version'];
  if (version === currentProgressVersion) return ok(stored);
  if (typeof version !== 'number' || version > currentProgressVersion) {
    return unsupported(version);
  }
  const step = chain[version];
  if (step === undefined) return unsupported(version);
  return migrate({ ...step(stored), version: version + 1 }, chain);
}

function describeIssue(issue: z.core.$ZodIssue, parent: readonly PropertyKey[] = []): string[] {
  const path = [...parent, ...issue.path];
  if (issue.code === 'invalid_key') {
    return issue.issues.flatMap((nested) => describeIssue(nested, path));
  }
  const text = path.map(String).join('.');
  return [text === '' ? issue.message : `${text}: ${issue.message}`];
}

export function parseProgressWith(
  chain: MigrationChain,
  input: unknown,
): Result<Progress, ProgressError> {
  if (!isRecord(input) || input['version'] === undefined) {
    return err({ code: 'malformed', issues: ['expected an object with a version'] });
  }
  const migrated = migrate(input, chain);
  if (!migrated.ok) return migrated;
  const parsed = progressSchema.safeParse(migrated.value);
  return parsed.success
    ? ok(parsed.data)
    : err({
        code: 'malformed',
        issues: parsed.error.issues.flatMap((issue) => describeIssue(issue)),
      });
}

export function parseProgress(input: unknown): Result<Progress, ProgressError> {
  return parseProgressWith(migrations, input);
}

export function parseProgressJson(text: string): Result<Progress, ProgressError> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return err({ code: 'malformed', issues: ['not valid JSON'] });
  }
  return parseProgress(parsed);
}

export function serializeProgress(progress: Progress): string {
  return JSON.stringify(progress);
}
