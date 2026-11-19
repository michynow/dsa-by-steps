import { linkedListsLesson as lesson } from '../src/content/foundations/linked-lists/lesson';
import en from '../src/content/foundations/linked-lists/en.json' with { type: 'json' };
import pl from '../src/content/foundations/linked-lists/pl.json' with { type: 'json' };

interface CheckText {
  readonly prompt: string;
  readonly options?: Readonly<Record<string, string>>;
  readonly explanation: string;
}

interface StepText {
  readonly title: string;
  readonly caption: string;
}

const stepTexts: Readonly<Record<string, StepText>> = en.steps;
const checkTexts: Readonly<Record<string, CheckText>> = en.checks;
const polishStepTexts: Readonly<Record<string, StepText>> = pl.steps;

export const stepCount = lesson.steps.length;
export const lessonTitle = en.title;
export const checkIds = Object.keys(en.checks);

export function escaped(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function visibleText(raw: string): RegExp {
  const longest = raw
    .split(/\[\[[^\]]*\]\]/)
    .map((piece) => piece.trim())
    .reduce((best, piece) => (piece.length > best.length ? piece : best), '');
  return new RegExp(escaped(longest));
}

function stepText(id: string): StepText {
  const text = stepTexts[id];
  if (text === undefined) throw new Error(`no text for Step ${id}`);
  return text;
}

export const firstStepTitle = stepText(lesson.steps[0]?.id ?? '').title;
export const polishFirstStepTitle = polishStepTexts[lesson.steps[0]?.id ?? '']?.title ?? '';

export function stepNumberOf(index: number): string {
  return String(index + 1);
}

export interface ChoiceCase {
  readonly number: number;
  readonly wrong: RegExp;
  readonly correct: RegExp;
  readonly caption: RegExp;
  readonly explanation: RegExp;
}

export interface PredictCase {
  readonly number: number;
  readonly correct: RegExp;
  readonly wrong: RegExp;
}

export function choiceCase(): ChoiceCase {
  const index = lesson.steps.findIndex((step) => step.check?.kind === 'choice');
  const step = lesson.steps[index];
  const check = step?.check;
  if (step === undefined || check?.kind !== 'choice') throw new Error('no Choice Check');
  const text = checkTexts[check.id];
  const label = (option: string | undefined): string => text?.options?.[option ?? ''] ?? '';
  return {
    number: index + 1,
    wrong: new RegExp(
      `^${escaped(label(check.options.find((option) => option !== check.correct)))}`,
    ),
    correct: new RegExp(`^${escaped(label(check.correct))}`),
    caption: visibleText(stepText(step.id).caption),
    explanation: visibleText(text?.explanation ?? ''),
  };
}

function valuesBefore(stepIndex: number): ReadonlyMap<string, unknown> {
  const values = new Map<string, unknown>();
  for (const step of lesson.steps.slice(0, stepIndex)) {
    for (const event of step.events) {
      if (event.type === 'create' && event.structure.kind === 'linked-list') {
        event.structure.nodes.forEach((node) => values.set(node.id, node.value));
      }
      if (event.type === 'add-node') values.set(event.node.id, event.node.value);
      if (event.type === 'remove-node') values.delete(event.target.elementId);
    }
  }
  return values;
}

export function predictCase(): PredictCase {
  const index = lesson.steps.findIndex((step) => step.check?.kind === 'predict');
  const check = lesson.steps[index]?.check;
  if (check?.kind !== 'predict') throw new Error('no Predict Check');
  const values = valuesBefore(index + 1);
  const wrongId = [...values.keys()].find((id) => id !== check.correct.elementId);
  const name = (id: string | undefined): RegExp =>
    new RegExp(`^Select ${escaped(String(values.get(id ?? '')))},`);
  return { number: index + 1, correct: name(check.correct.elementId), wrong: name(wrongId) };
}
