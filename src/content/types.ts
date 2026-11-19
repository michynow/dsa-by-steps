import type { CheckId, Lesson, Locale, ModuleSlug, OptionId, OutcomeId, StepId } from '@/domain';

export type TermId = string;

export interface StepMessages {
  readonly title: string;
  readonly caption: string;
  readonly keyIdea?: string;
}

export interface CheckMessages {
  readonly prompt: string;
  readonly options?: Readonly<Record<OptionId, string>>;
  readonly explanation: string;
}

export interface TermMessages {
  readonly term: string;
  readonly gloss: string;
}

export interface StoryMessages {
  readonly title: string;
  readonly summary: string;
}

export interface UseMessages {
  readonly title: string;
  readonly body: string;
}

export interface LessonMessages {
  readonly title: string;
  readonly story: StoryMessages;
  readonly uses: readonly UseMessages[];
  readonly whenNot: string;
  readonly outcomes: Readonly<Record<OutcomeId, string>>;
  readonly steps: Readonly<Record<StepId, StepMessages>>;
  readonly checks: Readonly<Record<CheckId, CheckMessages>>;
  readonly terms: Readonly<Record<TermId, TermMessages>>;
}

export interface LessonContent {
  readonly module: ModuleSlug;
  readonly lesson: Lesson;
  readonly terms: readonly TermId[];
  readonly messages: Readonly<Record<Locale, LessonMessages>>;
}

export interface ModuleContent {
  readonly slug: ModuleSlug;
  readonly titles: Readonly<Record<Locale, string>>;
  readonly lessons: readonly LessonContent[];
}
