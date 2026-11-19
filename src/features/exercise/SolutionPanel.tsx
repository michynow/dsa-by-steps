import { Suspense, useState } from 'react';
import type { ReactElement } from 'react';
import { Button } from '@/ui';
import styles from './exercise.module.css';
import type { ExerciseMessages } from './messages';
import { LazyCodeEditor } from './lazy-code-editor';

export interface SolutionPanelProps {
  readonly solution: string;
  readonly unlocked: boolean;
  readonly messages: ExerciseMessages;
}

export function SolutionPanel({ solution, unlocked, messages }: SolutionPanelProps): ReactElement {
  const [open, setOpen] = useState(false);
  return (
    <section aria-labelledby="exercise-solution-title" className={styles.panel}>
      <h2 id="exercise-solution-title" className={styles.panelTitle}>
        {messages.solution.title}
      </h2>
      {unlocked ? (
        <Button
          aria-expanded={open}
          aria-controls="exercise-solution-code"
          onClick={() => {
            setOpen(!open);
          }}
        >
          {open ? messages.solution.hide : messages.solution.show}
        </Button>
      ) : (
        <p>{messages.solution.locked}</p>
      )}
      {unlocked && open ? (
        <div id="exercise-solution-code">
          <Suspense fallback={<p>{messages.loadingEditor}</p>}>
            <LazyCodeEditor
              path="file:///reference-solution.ts"
              value={solution}
              label={messages.solution.label}
              readOnly
              height="16rem"
            />
          </Suspense>
        </div>
      ) : null}
    </section>
  );
}
