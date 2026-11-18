import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useMessages } from '@/features/locale';
import { formatMessage } from './format-message';
import { lessonPlayerMessages } from './messages';

export function useDocumentTitle(lessonTitle: string): void {
  const { t } = useTranslation();
  const messages = useMessages(lessonPlayerMessages);
  const title = formatMessage(messages.document, {
    lesson: lessonTitle,
    course: t('course.title'),
  });
  useEffect(() => {
    const previous = document.title;
    document.title = title;
    return () => {
      document.title = previous;
    };
  }, [title]);
}
