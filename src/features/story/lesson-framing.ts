import type { LessonMessages, StoryMessages, UseMessages } from '@/content';

export interface LessonOutro {
  readonly uses: readonly UseMessages[];
  readonly whenNot: string;
}

export interface LessonFraming {
  readonly story: StoryMessages | undefined;
  readonly outro: LessonOutro | undefined;
}

export function lessonFraming(
  messages: LessonMessages,
  step: number,
  stepCount: number,
): LessonFraming {
  return {
    story: step === 0 ? messages.story : undefined,
    outro: step === stepCount - 1 ? { uses: messages.uses, whenNot: messages.whenNot } : undefined,
  };
}
