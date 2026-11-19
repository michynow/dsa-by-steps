import type ts from 'typescript';
import type { Result } from '@/domain';
import { err, ok } from '@/domain';
import type { CompileError } from './types';

type Compiler = typeof ts;

let compilerPromise: Promise<Compiler> | undefined;

function loadCompiler(): Promise<Compiler> {
  compilerPromise ??= import('typescript').then((module) => module.default);
  return compilerPromise;
}

function positionOf(file: ts.SourceFile, start: number): Pick<CompileError, 'line' | 'column'> {
  const position = file.getLineAndCharacterOfPosition(start);
  return { line: position.line + 1, column: position.character + 1 };
}

function toCompileError(compiler: Compiler, diagnostic: ts.Diagnostic): CompileError {
  const message = compiler.flattenDiagnosticMessageText(diagnostic.messageText, '\n');
  if (diagnostic.file === undefined || diagnostic.start === undefined) {
    return { message, line: 1, column: 1 };
  }
  return { message, ...positionOf(diagnostic.file, diagnostic.start) };
}

function isModuleStatement(compiler: Compiler, statement: ts.Statement): boolean {
  const modifiers = compiler.canHaveModifiers(statement)
    ? compiler.getModifiers(statement)
    : undefined;
  const exported = modifiers?.some(
    (modifier) => modifier.kind === compiler.SyntaxKind.ExportKeyword,
  );
  return (
    compiler.isImportDeclaration(statement) ||
    compiler.isImportEqualsDeclaration(statement) ||
    compiler.isExportDeclaration(statement) ||
    compiler.isExportAssignment(statement) ||
    exported === true
  );
}

function moduleStatementError(compiler: Compiler, source: string): CompileError | undefined {
  const file = compiler.createSourceFile('input.ts', source, compiler.ScriptTarget.ES2023, true);
  const statement = file.statements.find((candidate) => isModuleStatement(compiler, candidate));
  return statement === undefined
    ? undefined
    : {
        message: 'Import and export statements are not supported',
        ...positionOf(file, statement.getStart(file)),
      };
}

function transpileWith(compiler: Compiler, source: string): Result<string, CompileError> {
  const output = compiler.transpileModule(source, {
    reportDiagnostics: true,
    compilerOptions: { target: compiler.ScriptTarget.ES2023, module: compiler.ModuleKind.ESNext },
  });
  const [first] = output.diagnostics ?? [];
  if (first !== undefined) return err(toCompileError(compiler, first));
  const moduleError = moduleStatementError(compiler, source);
  return moduleError === undefined ? ok(output.outputText) : err(moduleError);
}

export async function transpile(source: string): Promise<Result<string, CompileError>> {
  return transpileWith(await loadCompiler(), source);
}
