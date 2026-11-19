import type { RunReport } from '@/domain';

export interface CompileError {
  readonly message: string;
  readonly line: number;
  readonly column: number;
}

export type RunResult =
  | { readonly kind: 'report'; readonly report: RunReport }
  | { readonly kind: 'compile-error'; readonly error: CompileError }
  | { readonly kind: 'internal-error'; readonly message: string };

export interface WorkerLike {
  postMessage(message: unknown): void;
  onmessage: ((event: MessageEvent) => void) | null;
  onerror: ((event: ErrorEvent) => void) | null;
  terminate(): void;
}
