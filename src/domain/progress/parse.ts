import { z } from 'zod';
import { err, ok } from '../result';
import type { Result } from '../result';
import { currentProgressVersion } from './types';
import type { Progress, ProgressError } from './types';

const slug = '[a-z0-9]+(?:-[a-z0-9]+)*';
const count = z.number().int().nonnegative();
const lessonKeySchema = z.string().regex(new RegExp(`^${slug}/${slug}$`), 'invalid lesson key');
const checkKeySchema = z
  .string()
  .regex(new RegExp(`^${slug}/${slug}/${slug}$`), 'invalid check key');

export const progressSchema = z.object({
  version: z.literal(currentProgressVersion),
  stepsSeen: z.record(lessonKeySchema, z.array(z.string())),
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
  if (typeof version !== 'number') return unsupported(version);
  const step = chain[version];
  if (step === undefined) return unsupported(version);
  return migrate({ ...step(stored), version: version + 1 }, chain);
}

function describeIssue(issue: z.core.$ZodIssue): string {
  const path = issue.path.map(String).join('.');
  return path === '' ? issue.message : `${path}: ${issue.message}`;
}

export function parseProgressWith(
  chain: MigrationChain,
  input: unknown,
): Result<Progress, ProgressError> {
  if (!isRecord(input) || !('version' in input)) {
    return err({ code: 'malformed', issues: ['expected an object with a version'] });
  }
  const migrated = migrate(input, chain);
  if (!migrated.ok) return migrated;
  const parsed = progressSchema.safeParse(migrated.value);
  return parsed.success
    ? ok(parsed.data)
    : err({ code: 'malformed', issues: parsed.error.issues.map(describeIssue) });
}

export function parseProgress(input: unknown): Result<Progress, ProgressError> {
  return parseProgressWith(migrations, input);
}

export function parseProgressJson(text: string): Result<Progress, ProgressError> {
  try {
    return parseProgress(JSON.parse(text));
  } catch {
    return err({ code: 'malformed', issues: ['not valid JSON'] });
  }
}

export function serializeProgress(progress: Progress): string {
  return JSON.stringify(progress);
}
