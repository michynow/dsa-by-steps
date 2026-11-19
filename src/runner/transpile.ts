import ts from 'typescript';
import type { Result } from '@/domain';
import { err, ok } from '@/domain';
import type { CompileError } from './types';

function toCompileError(diagnostic: ts.Diagnostic): CompileError {
  const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n');
  if (diagnostic.file === undefined || diagnostic.start === undefined) {
    return { message, line: 1, column: 1 };
  }
  const position = ts.getLineAndCharacterOfPosition(diagnostic.file, diagnostic.start);
  return { message, line: position.line + 1, column: position.character + 1 };
}

export function transpile(source: string): Result<string, CompileError> {
  const output = ts.transpileModule(source, {
    reportDiagnostics: true,
    compilerOptions: { target: ts.ScriptTarget.ES2023, module: ts.ModuleKind.ESNext },
  });
  const [first] = output.diagnostics ?? [];
  return first === undefined ? ok(output.outputText) : err(toCompileError(first));
}
