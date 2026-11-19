import type { Lesson, Scene } from '@/domain';

export function displayedScene(
  lesson: Lesson,
  scenes: readonly Scene[],
  step: number,
  showsBefore: boolean,
): Scene {
  if (step >= lesson.steps.length) return scenes.at(-1) ?? lesson.initialScene;
  if (showsBefore)
    return step === 0 ? lesson.initialScene : (scenes[step - 1] ?? lesson.initialScene);
  return scenes[step] ?? lesson.initialScene;
}
