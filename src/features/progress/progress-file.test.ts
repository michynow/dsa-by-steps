import { describe, expect, it } from 'vitest';
import { emptyProgress, lessonKey, markStepSeen } from '@/domain';
import { progressExportFile, readProgressFile } from './progress-file';

const progress = markStepSeen(emptyProgress, lessonKey('arrays', 'binary-search'), 'intro');

describe('progressExportFile', () => {
  it('names the file by the UTC date across a date boundary', () => {
    const file = progressExportFile(progress, new Date('2026-11-18T23:30:00-02:00'));
    expect(file.filename).toBe('dsa-by-steps-progress-2026-11-19.json');
  });

  it('round-trips through readProgressFile', () => {
    const { contents } = progressExportFile(progress, new Date('2026-11-18T12:00:00Z'));
    expect(readProgressFile(contents)).toEqual({ ok: true, value: progress });
  });
});

describe('readProgressFile', () => {
  it('returns the parse error for text that is not Progress', () => {
    expect(readProgressFile('nope')).toEqual({
      ok: false,
      error: { code: 'malformed', issues: ['not valid JSON'] },
    });
  });
});
