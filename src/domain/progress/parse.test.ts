import { describe, expect, it } from 'vitest';
import { parseProgress, parseProgressJson, parseProgressWith, serializeProgress } from './parse';
import type { Progress } from './types';
import { emptyProgress } from './types';

const full: Progress = {
  version: 1,
  stepsSeen: { 'arrays/binary-search': ['s1', 's2'] },
  checks: {
    'arrays/binary-search/mid': { misses: 2, status: 'revealed' },
    'arrays/binary-search/lo': { misses: 0, status: 'passed' },
  },
  exercises: {
    'arrays/binary-search': { code: 'return 1;\n"x"', hintsTaken: 2, rejections: 3, passed: true },
  },
};

function issuesOf(input: unknown): readonly string[] {
  const result = parseProgress(input);
  if (result.ok || result.error.code !== 'malformed') throw new Error('expected malformed');
  return result.error.issues;
}

describe('parseProgress', () => {
  it('accepts empty Progress', () => {
    expect(parseProgress(emptyProgress)).toEqual({ ok: true, value: emptyProgress });
  });
  it.each([null, 'text', 3, [], undefined])('rejects non-object %s as malformed', (input) => {
    expect(issuesOf(input).length).toBeGreaterThan(0);
  });
  it('rejects a missing version as malformed', () => {
    expect(issuesOf({ stepsSeen: {}, checks: {}, exercises: {} }).length).toBeGreaterThan(0);
  });
  it('reports a future version as unsupported-version', () => {
    expect(parseProgress({ ...emptyProgress, version: 2 })).toEqual({
      ok: false,
      error: { code: 'unsupported-version', version: 2 },
    });
  });
  it.each([0, '1', null, 1.5])('reports unknown version %s as unsupported-version', (version) => {
    expect(parseProgress({ ...emptyProgress, version })).toEqual({
      ok: false,
      error: { code: 'unsupported-version', version },
    });
  });
  it('rejects a bad lesson key pattern with the path', () => {
    const issues = issuesOf({ ...emptyProgress, stepsSeen: { 'Arrays/x': [] } });
    expect(issues[0]).toContain('Arrays/x');
  });
  it('rejects a bad check key pattern', () => {
    expect(
      issuesOf({ ...emptyProgress, checks: { 'a/b': { misses: 0, status: 'open' } } }).length,
    ).toBe(1);
  });
  it('rejects a bad exercise key pattern', () => {
    const exercise = { code: '', hintsTaken: 0, rejections: 0, passed: false };
    expect(issuesOf({ ...emptyProgress, exercises: { 'a/b/c': exercise } }).length).toBe(1);
  });
  it.each([-1, 1.5])('rejects misses %s', (misses) => {
    const checks = { 'a/b/c': { misses, status: 'open' } };
    expect(issuesOf({ ...emptyProgress, checks })[0]).toContain('checks.a/b/c.misses');
  });
  it.each([-1, 0.5])('rejects exercise numbers %s', (n) => {
    const exercises = { 'a/b': { code: '', hintsTaken: n, rejections: n, passed: false } };
    expect(issuesOf({ ...emptyProgress, exercises }).length).toBe(2);
  });
  it('rejects an invalid status', () => {
    const checks = { 'a/b/c': { misses: 0, status: 'done' } };
    expect(issuesOf({ ...emptyProgress, checks })[0]).toContain('status');
  });
  it('rejects missing branches', () => {
    expect(issuesOf({ version: 1 }).length).toBe(3);
  });
});

describe('parseProgress migration chain', () => {
  const chain = {
    0: (older: Readonly<Record<string, unknown>>) => ({
      stepsSeen: older['seen'],
      checks: {},
      exercises: {},
    }),
  };
  it('migrates a known older version before validation', () => {
    const old = { version: 0, seen: { 'a/b': ['s1'] } };
    expect(parseProgressWith(chain, old)).toEqual({
      ok: true,
      value: { version: 1, stepsSeen: { 'a/b': ['s1'] }, checks: {}, exercises: {} },
    });
  });
  it('validates migrated output', () => {
    const result = parseProgressWith(chain, { version: 0, seen: 5 });
    expect(result.ok).toBe(false);
  });
  it('reports versions missing from the chain as unsupported-version', () => {
    expect(parseProgressWith(chain, { version: -1 })).toEqual({
      ok: false,
      error: { code: 'unsupported-version', version: -1 },
    });
  });
});

describe('parseProgressJson', () => {
  it('reports invalid JSON text as malformed', () => {
    expect(parseProgressJson('{nope')).toEqual({
      ok: false,
      error: { code: 'malformed', issues: ['not valid JSON'] },
    });
  });
  it('round-trips a Progress with every field populated', () => {
    expect(parseProgressJson(serializeProgress(full))).toEqual({ ok: true, value: full });
  });
});
