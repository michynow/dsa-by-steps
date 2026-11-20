import { useEffect, useMemo, useState } from 'react';
import type { ReactElement } from 'react';
import type { LessonContent } from '@/content';
import { elementIdsOf, scenesOf } from '@/domain';
import type { Locale, Scene } from '@/domain';
import { useLocale, useMessages } from '@/features/locale';
import { SceneView, boundsOf } from '@/renderer';
import { Button, useReducedMotion } from '@/ui';
import { lessonPlayerMessages } from './messages';
import { sceneLabelsOf } from './scene-labels';
import styles from './LessonReel.module.css';

const REEL_BEAT_MILLISECONDS = 1600;
const SHOTS_PER_LESSON = 6;

interface Shot {
  readonly lesson: number;
  readonly title: string;
  readonly scene: Scene;
}

function hasElements(scene: Scene): boolean {
  return scene.structures.some((structure) => elementIdsOf(structure).length > 0);
}

function shotsOf(lessons: readonly LessonContent[], locale: Locale): readonly Shot[] {
  return lessons.flatMap((content, lesson) => {
    const scenes = scenesOf(content.lesson);
    if (!scenes.ok) return [];
    return scenes.value
      .filter(hasElements)
      .slice(0, SHOTS_PER_LESSON)
      .map((scene) => ({
        lesson,
        title: content.messages[locale].title,
        scene,
      }));
  });
}

function useReelIndex(length: number, running: boolean): number {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    if (!running || length < 2) return undefined;
    const timer = setInterval(() => {
      setIndex((current) => (current + 1) % length);
    }, REEL_BEAT_MILLISECONDS);
    return () => {
      clearInterval(timer);
    };
  }, [length, running]);
  return length === 0 ? 0 : index % length;
}

export function LessonReel({
  lessons,
}: {
  readonly lessons: readonly LessonContent[];
}): ReactElement | null {
  const locale = useLocale();
  const messages = useMessages(lessonPlayerMessages);
  const reduced = useReducedMotion();
  const [paused, setPaused] = useState(false);
  const shots = useMemo(() => shotsOf(lessons, locale), [lessons, locale]);
  const bounds = useMemo(() => boundsOf(shots.map((candidate) => candidate.scene)), [shots]);
  const lessonBounds = useMemo(
    () =>
      lessons.map((_, lesson) =>
        boundsOf(shots.filter((candidate) => candidate.lesson === lesson).map((c) => c.scene)),
      ),
    [lessons, shots],
  );
  const index = useReelIndex(shots.length, !paused && !reduced);
  const shot = shots[index];
  if (shot === undefined) return null;

  return (
    <figure className={styles.reel} aria-label={messages.reel.label}>
      <figcaption className={styles.caption}>
        <span className={styles.now}>{messages.reel.nowShowing}</span>
        <span className={styles.title}>{shot.title}</span>
      </figcaption>
      <div className={styles.screen} aria-hidden="true">
        <SceneView
          scene={shot.scene}
          labels={sceneLabelsOf(messages)}
          bounds={bounds}
          centeredOn={lessonBounds[shot.lesson]}
        />
      </div>
      <div className={styles.footer}>
        <ol className={styles.ticks} aria-hidden="true">
          {lessons.map((content, lesson) => (
            <li
              key={content.lesson.slug}
              className={styles.tick}
              data-current={lesson === shot.lesson ? 'true' : undefined}
            />
          ))}
        </ol>
        {reduced ? null : (
          <Button
            onClick={() => {
              setPaused((current) => !current);
            }}
          >
            {paused ? messages.playback.play : messages.playback.pause}
          </Button>
        )}
      </div>
    </figure>
  );
}
