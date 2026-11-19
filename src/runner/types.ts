import type { RunReport } from '@/domain';

export interface CompileError {
  readonly message: string;
  readonly line: number;
  readonly column: number;
}

export type RunResult =
  | { readonly kind: 'report'; readonly report: RunReport }
  | { readonly kind: 'compile-error'; readonly error: CompileError }
  | { readonly kind: 'timed-out'; readonly limitMs: number };

export interface WorkerLike {
  postMessage(message: unknown): void;
  onmessage: ((event: MessageEvent) => void) | null;
  terminate(): void;
}
