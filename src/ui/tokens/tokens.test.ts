import tokensCss from './tokens.css?raw';

const names = ['turn', 'term'].flatMap((family) =>
  ['', '-ink', '-surface', '-border'].map((suffix) => `--color-${family}${suffix}`),
);

function blockAfter(marker: string): string {
  const start = tokensCss.indexOf(marker);
  return start === -1 ? '' : tokensCss.slice(start, tokensCss.indexOf('}', start));
}

const blocks = {
  root: blockAfter(':root {'),
  'dark media block': blockAfter(":root:not([data-theme='light']) {"),
  'data-theme dark block': blockAfter(":root[data-theme='dark'] {"),
};

describe('turn and term tokens', () => {
  for (const [label, block] of Object.entries(blocks)) {
    it(`gives every turn and term token a colour value in the ${label}`, () => {
      expect(
        names.filter((name) => !new RegExp(`${name}:\\s*#[0-9a-fA-F]{6};`).test(block)),
      ).toEqual([]);
    });
  }
});
