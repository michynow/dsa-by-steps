import { readFileSync } from 'node:fs';

const css = readFileSync('src/ui/tokens/tokens.css', 'utf8');

const names = ['turn', 'term'].flatMap((family) =>
  ['', '-ink', '-surface', '-border'].map((suffix) => `--color-${family}${suffix}`),
);

function blockAfter(marker: string): string {
  const start = css.indexOf(marker);
  return start === -1 ? '' : css.slice(start, css.indexOf('}', start));
}

const blocks = {
  root: blockAfter(':root {'),
  'dark media block': blockAfter(":root:not([data-theme='light']) {"),
  'data-theme dark block': blockAfter(":root[data-theme='dark'] {"),
};

describe('turn and term tokens', () => {
  for (const [label, block] of Object.entries(blocks)) {
    it(`defines every turn and term token in the ${label}`, () => {
      expect(names.filter((name) => !block.includes(`${name}:`))).toEqual([]);
    });
  }
});
