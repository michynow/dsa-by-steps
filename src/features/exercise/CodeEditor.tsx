import Editor from '@monaco-editor/react';
import type { OnMount } from '@monaco-editor/react';
import { useEffect, useRef } from 'react';
import type { ReactElement, RefObject } from 'react';
import { monaco } from './monaco-setup';
import { useIsDark } from './use-color-scheme';

export interface CursorTarget {
  readonly line: number;
  readonly column: number;
  readonly nonce: number;
}

export interface EditorCommands {
  readonly onRun: () => void;
  readonly onSubmit: () => void;
  readonly onLeave: () => void;
}

export interface CodeEditorProps {
  readonly path: string;
  readonly value: string;
  readonly label: string;
  readonly readOnly?: boolean;
  readonly extraLib?: string;
  readonly height: string;
  readonly cursor?: CursorTarget | null;
  readonly commands?: RefObject<EditorCommands>;
  readonly onChange?: (value: string) => void;
}

const escapeContext =
  '!suggestWidgetVisible && !findWidgetVisible && !parameterHintsVisible && !renameInputVisible';

function bindCommands(
  editor: monaco.editor.IStandaloneCodeEditor,
  commands: RefObject<EditorCommands>,
): void {
  const { KeyCode, KeyMod } = monaco;
  editor.addCommand(KeyMod.CtrlCmd | KeyCode.Enter, () => {
    commands.current.onRun();
  });
  editor.addCommand(KeyMod.CtrlCmd | KeyMod.Shift | KeyCode.Enter, () => {
    commands.current.onSubmit();
  });
  editor.addCommand(
    KeyCode.Escape,
    () => {
      commands.current.onLeave();
    },
    escapeContext,
  );
}

export function CodeEditor({
  path,
  value,
  label,
  readOnly = false,
  extraLib,
  height,
  cursor = null,
  commands,
  onChange,
}: CodeEditorProps): ReactElement {
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const dark = useIsDark();

  useEffect(() => {
    if (extraLib === undefined) return undefined;
    const lib = monaco.typescript.typescriptDefaults.addExtraLib(extraLib, 'file:///prelude.ts');
    return () => {
      lib.dispose();
    };
  }, [extraLib]);

  useEffect(() => {
    const editor = editorRef.current;
    if (cursor === null || editor === null) return;
    editor.setPosition({ lineNumber: cursor.line, column: cursor.column });
    editor.revealPositionInCenter({ lineNumber: cursor.line, column: cursor.column });
    editor.focus();
  }, [cursor]);

  const handleMount: OnMount = (editor) => {
    editorRef.current = editor;
    if (commands !== undefined) bindCommands(editor, commands);
  };

  return (
    <Editor
      path={path}
      language="typescript"
      defaultValue={value}
      theme={dark ? 'vs-dark' : 'light'}
      height={height}
      onMount={handleMount}
      onChange={(next) => onChange?.(next ?? '')}
      options={{
        ariaLabel: label,
        readOnly,
        minimap: { enabled: false },
        automaticLayout: true,
        scrollBeyondLastLine: false,
        fontSize: 14,
        tabSize: 2,
        wordWrap: 'on',
        wrappingIndent: 'indent',
      }}
    />
  );
}
