import { parseProgressJson, serializeProgress } from '@/domain';
import type { Progress, ProgressError, Result } from '@/domain';

export function progressExportFile(
  progress: Progress,
  now: Date,
): { readonly filename: string; readonly contents: string } {
  const day = now.toISOString().slice(0, 10);
  return { filename: `dsa-by-steps-progress-${day}.json`, contents: serializeProgress(progress) };
}

export function readProgressFile(text: string): Result<Progress, ProgressError> {
  return parseProgressJson(text);
}
