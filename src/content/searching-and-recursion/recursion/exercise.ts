import type { Exercise, JsonValue, TestCase } from '@/domain';

const file = (name: string, size: number): JsonValue => ({ name, size });
const folder = (name: string, entries: readonly JsonValue[]): JsonValue => ({ name, entries });

const totalOf = (id: string, root: JsonValue, total: number): TestCase => ({
  id,
  args: [{ shape: 'value', value: root }],
  expected: { shape: 'value', value: total },
});

const deepLevels = 1000;
const deepRoot = Array.from({ length: deepLevels }).reduceRight<JsonValue>(
  (inner, _, level) => folder(`level-${String(level)}`, [file(`file-${String(level)}`, 1), inner]),
  file('bottom.txt', 5),
);

const wideSizes = Array.from({ length: 2000 }, (_, index) => (index % 7) + 1);
const wideRoot = folder(
  'Shots',
  wideSizes.map((size, index) => file(`shot-${String(index)}.jpg`, size)),
);
const wideTotal = wideSizes.reduce((sum, size) => sum + size, 0);

const photos = folder('Photos', [
  file('logo.png', 12),
  folder('Trip', [file('beach.jpg', 40), folder('Day two', [file('hike.jpg', 35)])]),
  file('notes.txt', 3),
]);

export const totalSizeExercise: Exercise = {
  functionName: 'totalSize',
  starterCode: `type Entry =
  | { name: string; size: number }
  | { name: string; entries: Entry[] };

function totalSize(entry: Entry): number {
  return 0;
}
`,
  referenceSolution: `type Entry =
  | { name: string; size: number }
  | { name: string; entries: Entry[] };

function totalSize(entry: Entry): number {
  if ('size' in entry) return entry.size;
  let total = 0;
  for (const child of entry.entries) {
    total += totalSize(child);
  }
  return total;
}
`,
  visibleTests: [
    totalOf('flat-folder', folder('Docs', [file('cv.pdf', 20), file('letter.txt', 5)]), 25),
    totalOf(
      'folder-in-folder',
      folder('Docs', [
        folder('Drafts', [file('v1.txt', 4), file('v2.txt', 6)]),
        file('cv.pdf', 20),
      ]),
      30,
    ),
    totalOf('nested-folders', photos, 90),
    totalOf(
      'deep-chain',
      folder('Root', [folder('A', [folder('B', [file('deep.txt', 9)])]), file('top.txt', 1)]),
      10,
    ),
    totalOf(
      'empty-subfolder',
      folder('Docs', [folder('Drafts', []), file('cv.pdf', 20), file('empty.txt', 0)]),
      20,
    ),
  ],
  hiddenTests: [
    totalOf('empty-folder', folder('Empty', []), 0),
    totalOf('single-file', file('readme.md', 7), 7),
    totalOf(
      'only-empty-folders',
      folder('Root', [folder('A', [folder('B', [])]), folder('C', [])]),
      0,
    ),
    totalOf(
      'repeated-names',
      folder('Root', [
        folder('2023', [file('report.pdf', 10)]),
        folder('2024', [file('report.pdf', 10), folder('2023', [file('report.pdf', 4)])]),
      ]),
      24,
    ),
    totalOf('files-after-folders', folder('Root', [folder('A', [file('a', 2)]), file('b', 3)]), 5),
    totalOf('deep-folder', deepRoot, deepLevels + 5),
    totalOf('wide-folder', wideRoot, wideTotal),
  ],
  hintCount: 3,
};
