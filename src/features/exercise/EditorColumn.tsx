import { Suspense, useRef } from 'react';
import type { ReactElement } from 'react';
import type { Exercise } from '@/domain';
import { preludeFor } from '@/runner';
import styles from './exercise.module.css';
import { RunControls } from './RunControls';
import { LazyCodeEditor } from './lazy-code-editor';
import type { ExerciseMessages } from './messages';
import type { ExerciseCode } from './use-exercise-code';
import { useEditorCommands } from './use-editor-commands';
import type { ExerciseRun } from './use-exercise-run';

export interface EditorColumnProps {
  readonly exercise: Exercise;
  readonly code: ExerciseCode;
  readonly run: ExerciseRun;
  readonly messages: ExerciseMessages;
}

export function EditorColumn({ exercise, code, run, messages }: EditorColumnProps): ReactElement {
  const runButton = useRef<HTMLButtonElement | null>(null);
  const commands = useEditorCommands(run.start, runButton);
  return (
    <div className={styles.editorColumn}>
      <div className={styles.editorFrame}>
        <Suspense fallback={<p>{messages.loadingEditor}</p>}>
          <LazyCodeEditor
            path="file:///solution.ts"
            value={code.initial}
            label={messages.editor.label}
            extraLib={preludeFor(exercise)}
            height="22rem"
            cursor={run.cursor}
            commands={commands}
            onChange={code.edit}
          />
        </Suspense>
      </div>
      <p className={styles.editorHint}>{messages.editor.hint}</p>
      <RunControls
        running={run.running}
        messages={messages}
        runButton={runButton}
        onStart={run.start}
      />
    </div>
  );
}
