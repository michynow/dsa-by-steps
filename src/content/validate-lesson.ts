import type {
  Check,
  CheckId,
  ElementRef,
  Locale,
  OptionId,
  Scene,
  Step,
  StepEvent,
  StepId,
  Structure,
} from '@/domain';
import { hasMarker, malformedMarkers, stepTerms } from './caption';
import type { LessonContent, TermId } from './types';
import { exerciseIssues, exerciseTaskTerms, testIdsOf } from './validate-exercise';
import type { ExerciseIssue } from './validate-exercise';

export type IdKind =
  | 'module'
  | 'lesson'
  | 'step'
  | 'check'
  | 'outcome'
  | 'option'
  | 'term'
  | 'structure'
  | 'element'
  | 'pointer'
  | 'test';

export type ContentIssue =
  | { readonly code: 'missing-message-key'; readonly locale: Locale; readonly path: string }
  | { readonly code: 'extra-message-key'; readonly locale: Locale; readonly path: string }
  | {
      readonly code: 'locale-key-mismatch';
      readonly path: string;
      readonly presentIn: Locale;
      readonly absentIn: Locale;
    }
  | {
      readonly code: 'choice-correct-not-in-options';
      readonly check: CheckId;
      readonly correct: OptionId;
    }
  | {
      readonly code: 'choice-option-without-label';
      readonly locale: Locale;
      readonly check: CheckId;
      readonly option: OptionId;
    }
  | {
      readonly code: 'predict-target-missing';
      readonly step: StepId;
      readonly check: CheckId;
      readonly target: ElementRef;
    }
  | {
      readonly code: 'predict-answer-visible';
      readonly step: StepId;
      readonly check: CheckId;
      readonly target: ElementRef;
      readonly via: 'highlight' | 'pointer';
    }
  | {
      readonly code: 'check-scene-highlighted';
      readonly step: StepId;
      readonly check: CheckId;
      readonly count: number;
    }
  | {
      readonly code: 'order-structure-missing';
      readonly step: StepId;
      readonly check: CheckId;
      readonly structure: string;
    }
  | {
      readonly code: 'order-element-missing';
      readonly step: StepId;
      readonly check: CheckId;
      readonly structure: string;
      readonly element: string;
    }
  | {
      readonly code: 'unknown-term';
      readonly locale: Locale;
      readonly step: StepId;
      readonly term: TermId;
    }
  | {
      readonly code: 'term-locale-mismatch';
      readonly step: StepId;
      readonly term: TermId;
      readonly presentIn: Locale;
      readonly absentIn: Locale;
    }
  | { readonly code: 'marker-outside-caption'; readonly locale: Locale; readonly path: string }
  | {
      readonly code: 'malformed-marker';
      readonly locale: Locale;
      readonly path: string;
      readonly text: string;
    }
  | { readonly code: 'unused-term'; readonly term: TermId }
  | { readonly code: 'invalid-id'; readonly kind: IdKind; readonly id: string }
  | { readonly code: 'duplicate-step-id'; readonly step: StepId }
  | { readonly code: 'duplicate-check-id'; readonly check: CheckId }
  | ExerciseIssue;

const contentLocales: readonly Locale[] = ['en', 'pl'];

const kebabCase = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

interface IdUse {
  readonly kind: IdKind;
  readonly id: string;
}

interface ExpectedKey {
  readonly path: string;
  readonly option?: { readonly check: CheckId; readonly option: OptionId };
}

function elementIdsOf(structure: Structure): readonly string[] {
  switch (structure.kind) {
    case 'array':
      return structure.cells.map((cell) => cell.id);
    case 'linked-list':
      return structure.nodes.map((node) => node.id);
    case 'stack':
    case 'queue':
      return structure.items.map((cell) => cell.id);
    case 'hash-map':
      return structure.buckets.flatMap((bucket) => bucket.map((entry) => entry.id));
  }
}

function eventElementIds(event: StepEvent): readonly string[] {
  if (event.type === 'create') return elementIdsOf(event.structure);
  if (event.type === 'insert-cell' || event.type === 'push' || event.type === 'enqueue') {
    return [event.cell.id];
  }
  if (event.type === 'add-node') return [event.node.id];
  if (event.type === 'put-entry') return [event.entry.id];
  return [];
}

function eventStructureIds(event: StepEvent): readonly string[] {
  return event.type === 'create' ? [event.structure.id] : [];
}

function eventPointerIds(event: StepEvent): readonly string[] {
  return event.type === 'point' ? [event.pointer.id] : [];
}

function checkIdUses(check: Check): readonly IdUse[] {
  const own: readonly IdUse[] = [{ kind: 'check', id: check.id }];
  if (check.kind !== 'choice') return own;
  return [...own, ...check.options.map((id): IdUse => ({ kind: 'option', id }))];
}

function idUses(kind: IdKind, ids: readonly string[]): readonly IdUse[] {
  return ids.map((id): IdUse => ({ kind, id }));
}

function sceneIdUses(content: LessonContent): readonly IdUse[] {
  const { initialScene, steps } = content.lesson;
  const events = steps.flatMap((step) => step.events);
  return [
    ...idUses('structure', [
      ...initialScene.structures.map((s) => s.id),
      ...events.flatMap(eventStructureIds),
    ]),
    ...idUses('element', [
      ...initialScene.structures.flatMap(elementIdsOf),
      ...events.flatMap(eventElementIds),
    ]),
    ...idUses('pointer', [
      ...initialScene.pointers.map((p) => p.id),
      ...events.flatMap(eventPointerIds),
    ]),
  ];
}

function allIdUses(content: LessonContent): readonly IdUse[] {
  const { lesson } = content;
  const checks = lesson.steps.flatMap((step) => (step.check === undefined ? [] : [step.check]));
  return [
    ...idUses('module', [content.module]),
    ...idUses('lesson', [lesson.slug]),
    ...idUses('outcome', lesson.outcomes),
    ...idUses(
      'step',
      lesson.steps.map((step) => step.id),
    ),
    ...checks.flatMap(checkIdUses),
    ...idUses('term', content.terms),
    ...sceneIdUses(content),
    ...idUses('test', content.exercise === undefined ? [] : testIdsOf(content.exercise)),
  ];
}

function invalidIdIssues(content: LessonContent): readonly ContentIssue[] {
  const seen = new Set<string>();
  const issues: ContentIssue[] = [];
  for (const use of allIdUses(content)) {
    const key = `${use.kind}:${use.id}`;
    if (seen.has(key) || kebabCase.test(use.id)) continue;
    seen.add(key);
    issues.push({ code: 'invalid-id', kind: use.kind, id: use.id });
  }
  return issues;
}

function repeated(ids: readonly string[]): readonly string[] {
  return [...new Set(ids.filter((id, index) => ids.indexOf(id) !== index))];
}

function duplicateIssues(content: LessonContent): readonly ContentIssue[] {
  const steps = content.lesson.steps;
  const checkIds = steps.flatMap((step) => (step.check === undefined ? [] : [step.check.id]));
  return [
    ...repeated(steps.map((step) => step.id)).map((step): ContentIssue => ({
      code: 'duplicate-step-id',
      step,
    })),
    ...repeated(checkIds).map((check): ContentIssue => ({ code: 'duplicate-check-id', check })),
  ];
}

function sceneHasElement(scene: Scene, target: ElementRef): boolean {
  return scene.structures.some(
    (structure) =>
      structure.id === target.structureId && elementIdsOf(structure).includes(target.elementId),
  );
}

function orderIssues(
  step: Step,
  check: Extract<Check, { readonly kind: 'order' }>,
  scene: Scene | undefined,
): readonly ContentIssue[] {
  const structure = scene?.structures.find((s) => s.id === check.structureId);
  if (structure === undefined) {
    return [
      {
        code: 'order-structure-missing',
        step: step.id,
        check: check.id,
        structure: check.structureId,
      },
    ];
  }
  const present = elementIdsOf(structure);
  return check.correct
    .filter((element) => !present.includes(element))
    .map((element): ContentIssue => ({
      code: 'order-element-missing',
      step: step.id,
      check: check.id,
      structure: check.structureId,
      element,
    }));
}

function sameElement(a: ElementRef, b: ElementRef | null): boolean {
  return b !== null && a.structureId === b.structureId && a.elementId === b.elementId;
}

function answerVisibleIssues(
  step: Step,
  check: Check,
  target: ElementRef,
  scene: Scene,
): readonly ContentIssue[] {
  const via = scene.highlights.some((h) => sameElement(target, h.target))
    ? 'highlight'
    : scene.pointers.some((p) => sameElement(target, p.target))
      ? 'pointer'
      : undefined;
  return via === undefined
    ? []
    : [{ code: 'predict-answer-visible', step: step.id, check: check.id, target, via }];
}

function leftoverEmphasisIssues(step: Step, check: Check, scene: Scene): readonly ContentIssue[] {
  const count = scene.highlights.filter((h) => h.tone === 'compare' || h.tone === 'error').length;
  return count === 0
    ? []
    : [{ code: 'check-scene-highlighted', step: step.id, check: check.id, count }];
}

function checkIssues(step: Step, check: Check, scene: Scene | undefined): readonly ContentIssue[] {
  switch (check.kind) {
    case 'choice':
      return [
        ...(check.options.includes(check.correct)
          ? []
          : [
              {
                code: 'choice-correct-not-in-options',
                check: check.id,
                correct: check.correct,
              } as const,
            ]),
        ...(scene === undefined ? [] : leftoverEmphasisIssues(step, check, scene)),
      ];
    case 'predict':
      return scene !== undefined && sceneHasElement(scene, check.correct)
        ? answerVisibleIssues(step, check, check.correct, scene)
        : [
            {
              code: 'predict-target-missing',
              step: step.id,
              check: check.id,
              target: check.correct,
            },
          ];
    case 'order':
      return orderIssues(step, check, scene);
  }
}

function allCheckIssues(content: LessonContent, scenes: readonly Scene[]): readonly ContentIssue[] {
  const { initialScene, steps } = content.lesson;
  return steps.flatMap((step, index) =>
    step.check === undefined
      ? []
      : checkIssues(step, step.check, index === 0 ? initialScene : scenes[index - 1]),
  );
}

function checkKeys(check: Check): readonly ExpectedKey[] {
  const base = `checks.${check.id}`;
  const own: readonly ExpectedKey[] = [{ path: `${base}.prompt` }, { path: `${base}.explanation` }];
  if (check.kind !== 'choice') return own;
  return [
    ...own,
    ...check.options.map((option): ExpectedKey => ({
      path: `${base}.options.${option}`,
      option: { check: check.id, option },
    })),
  ];
}

function useKeys(content: LessonContent): readonly ExpectedKey[] {
  const count = Math.max(...contentLocales.map((locale) => content.messages[locale].uses.length));
  return Array.from({ length: count }, (_, index): readonly ExpectedKey[] => [
    { path: `uses.${String(index)}.title` },
    { path: `uses.${String(index)}.body` },
  ]).flat();
}

function keyIdeaKeys(content: LessonContent, step: Step): readonly ExpectedKey[] {
  const present = contentLocales.some(
    (locale) => content.messages[locale].steps[step.id]?.keyIdea !== undefined,
  );
  return present ? [{ path: `steps.${step.id}.keyIdea` }] : [];
}

function expectedKeys(content: LessonContent): readonly ExpectedKey[] {
  const { lesson } = content;
  return [
    { path: 'title' },
    { path: 'story.title' },
    { path: 'story.summary' },
    { path: 'whenNot' },
    ...useKeys(content),
    ...lesson.outcomes.map((id): ExpectedKey => ({ path: `outcomes.${id}` })),
    ...lesson.steps.flatMap((step): readonly ExpectedKey[] => [
      { path: `steps.${step.id}.title` },
      { path: `steps.${step.id}.caption` },
      ...keyIdeaKeys(content, step),
      ...(step.check === undefined ? [] : checkKeys(step.check)),
    ]),
    ...content.terms.flatMap((id): readonly ExpectedKey[] => [
      { path: `terms.${id}.term` },
      { path: `terms.${id}.gloss` },
    ]),
  ];
}

function keyPaths(value: unknown, prefix: string): readonly string[] {
  if (value === undefined) return [];
  if (typeof value !== 'object' || value === null) return [prefix];
  const entries = Object.entries(value);
  if (entries.length === 0) return prefix.includes('.') ? [prefix] : [];
  return entries.flatMap(([key, child]) =>
    keyPaths(child, prefix === '' ? key : `${prefix}.${key}`),
  );
}

function localeIssues(
  locale: Locale,
  expected: readonly ExpectedKey[],
  actual: ReadonlySet<string>,
): readonly ContentIssue[] {
  const expectedPaths = new Set(expected.map((key) => key.path));
  const isContainer = (path: string): boolean =>
    [...expectedPaths].some((candidate) => candidate.startsWith(`${path}.`));
  const missing = expected
    .filter((key) => !actual.has(key.path))
    .map((key): ContentIssue =>
      key.option === undefined
        ? { code: 'missing-message-key', locale, path: key.path }
        : { code: 'choice-option-without-label', locale, ...key.option },
    );
  const extra = [...actual]
    .filter((path) => !expectedPaths.has(path) && !isContainer(path))
    .map((path): ContentIssue => ({ code: 'extra-message-key', locale, path }));
  return [...missing, ...extra];
}

function mismatchIssues(actual: ReadonlyMap<Locale, ReadonlySet<string>>): readonly ContentIssue[] {
  return contentLocales.flatMap((presentIn) =>
    contentLocales
      .filter((absentIn) => absentIn !== presentIn)
      .flatMap((absentIn) =>
        [...(actual.get(presentIn) ?? [])]
          .filter((path) => actual.get(absentIn)?.has(path) !== true)
          .map((path): ContentIssue => ({
            code: 'locale-key-mismatch',
            path,
            presentIn,
            absentIn,
          })),
      ),
  );
}

function messageIssues(content: LessonContent): readonly ContentIssue[] {
  const expected = expectedKeys(content).filter(
    (key, index, all) => all.findIndex((other) => other.path === key.path) === index,
  );
  const actual = new Map(
    contentLocales.map((locale): [Locale, ReadonlySet<string>] => [
      locale,
      new Set(
        keyPaths(content.messages[locale], '').filter((path) => !path.startsWith('exercise.')),
      ),
    ]),
  );
  return [
    ...contentLocales.flatMap((locale) =>
      localeIssues(locale, expected, actual.get(locale) ?? new Set()),
    ),
    ...mismatchIssues(actual),
  ];
}

function unknownTermIssues(content: LessonContent): readonly ContentIssue[] {
  return contentLocales.flatMap((locale) =>
    content.lesson.steps.flatMap((step) =>
      [...new Set(stepTerms(content.messages[locale], step.id))]
        .filter((term) => !content.terms.includes(term))
        .map((term): ContentIssue => ({ code: 'unknown-term', locale, step: step.id, term })),
    ),
  );
}

function mismatchedTermIssues(content: LessonContent): readonly ContentIssue[] {
  return content.lesson.steps.flatMap((step) =>
    contentLocales.flatMap((presentIn) =>
      contentLocales
        .filter((absentIn) => absentIn !== presentIn)
        .flatMap((absentIn) => {
          const absent = stepTerms(content.messages[absentIn], step.id);
          return [...new Set(stepTerms(content.messages[presentIn], step.id))]
            .filter((term) => !absent.includes(term))
            .map((term): ContentIssue => ({
              code: 'term-locale-mismatch',
              step: step.id,
              term,
              presentIn,
              absentIn,
            }));
        }),
    ),
  );
}

function leafStrings(value: unknown, prefix: string): readonly (readonly [string, string])[] {
  if (typeof value === 'string') return [[prefix, value]];
  if (typeof value !== 'object' || value === null) return [];
  return Object.entries(value).flatMap(([key, child]) =>
    leafStrings(child, prefix === '' ? key : `${prefix}.${key}`),
  );
}

const captionPath = /^(?:steps\.[^.]+\.(?:caption|keyIdea)|exercise\.task)$/;

function markerPlacementIssues(content: LessonContent): readonly ContentIssue[] {
  return contentLocales.flatMap((locale) =>
    leafStrings(content.messages[locale], '').flatMap(([path, text]): readonly ContentIssue[] => {
      if (captionPath.test(path)) {
        return malformedMarkers(text).map((marker): ContentIssue => ({
          code: 'malformed-marker',
          locale,
          path,
          text: marker,
        }));
      }
      return hasMarker(text) ? [{ code: 'marker-outside-caption', locale, path }] : [];
    }),
  );
}

function unusedTermIssues(content: LessonContent): readonly ContentIssue[] {
  const marked = new Set([
    ...contentLocales.flatMap((locale) =>
      content.lesson.steps.flatMap((step) => stepTerms(content.messages[locale], step.id)),
    ),
    ...exerciseTaskTerms(content),
  ]);
  return content.terms
    .filter((term) => !marked.has(term))
    .map((term): ContentIssue => ({ code: 'unused-term', term }));
}

export function validateLessonContent(
  content: LessonContent,
  scenes: readonly Scene[],
): readonly ContentIssue[] {
  return [
    ...invalidIdIssues(content),
    ...duplicateIssues(content),
    ...allCheckIssues(content, scenes),
    ...messageIssues(content),
    ...markerPlacementIssues(content),
    ...unknownTermIssues(content),
    ...mismatchedTermIssues(content),
    ...unusedTermIssues(content),
    ...exerciseIssues(content),
  ];
}
