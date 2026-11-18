import type { ReactElement } from 'react';
import type { CheckMessages, LessonContent } from '@/content';
import { lessonKey } from '@/domain';
import type { Check, Course } from '@/domain';
import { useLocale } from '@/features/locale';
import { LessonLayout } from './LessonLayout';
import { uncheckedStep } from './step-check';
import type { UseStepCheck } from './step-check';

export interface LessonViewProps {
  readonly course: Course;
  readonly content: LessonContent;
  readonly step: number;
  readonly useStepCheck: UseStepCheck;
}

interface CheckedLessonProps extends LessonViewProps {
  readonly check: Check;
  readonly checkMessages: CheckMessages;
}

function CheckedLesson({
  course,
  content,
  step,
  useStepCheck,
  check,
  checkMessages,
}: CheckedLessonProps): ReactElement {
  const binding = useStepCheck(
    lessonKey(content.module, content.lesson.slug),
    check,
    checkMessages,
  );
  return (
    <LessonLayout
      course={course}
      content={content}
      locale={useLocale()}
      step={step}
      binding={binding}
    />
  );
}

export function LessonView(props: LessonViewProps): ReactElement {
  const locale = useLocale();
  const check = props.content.lesson.steps[props.step]?.check;
  const checkMessages =
    check === undefined ? undefined : props.content.messages[locale].checks[check.id];
  if (check !== undefined && checkMessages !== undefined) {
    return <CheckedLesson {...props} check={check} checkMessages={checkMessages} />;
  }
  return (
    <LessonLayout
      course={props.course}
      content={props.content}
      locale={locale}
      step={props.step}
      binding={uncheckedStep}
    />
  );
}
