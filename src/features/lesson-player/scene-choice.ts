import { stepStartScene } from '@/domain';
import type { Lesson, Scene } from '@/domain';

export function displayedScene(
  lesson: Lesson,
  scenes: readonly Scene[],
  step: number,
  showsBefore: boolean,
): Scene {
  if (step >= lesson.steps.length) return scenes.at(-1) ?? lesson.initialScene;
  if (showsBefore) return stepStartScene(lesson, scenes, step);
  return scenes[step] ?? lesson.initialScene;
}
