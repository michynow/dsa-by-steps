import { useEffect, useRef } from 'react';
import type { RefObject } from 'react';
import type { RunMode } from '@/domain';
import type { EditorCommands } from './CodeEditor';

export function useEditorCommands(
  start: (mode: RunMode) => void,
  runButton: RefObject<HTMLButtonElement | null>,
): RefObject<EditorCommands> {
  const commands = useRef<EditorCommands>({
    onRun: () => undefined,
    onSubmit: () => undefined,
    onLeave: () => undefined,
  });
  useEffect(() => {
    commands.current = {
      onRun: () => {
        start('run');
      },
      onSubmit: () => {
        start('submit');
      },
      onLeave: () => {
        runButton.current?.focus();
      },
    };
  }, [start, runButton]);
  return commands;
}
