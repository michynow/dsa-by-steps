import en from './en.json';
import pl from './pl.json';

function keyPaths(value: unknown, prefix = ''): string[] {
  if (typeof value !== 'object' || value === null) return [prefix];
  return Object.entries(value).flatMap(([key, child]) =>
    keyPaths(child, prefix ? `${prefix}.${key}` : key),
  );
}

describe('app messages', () => {
  it('define the same keys in every Locale', () => {
    expect(keyPaths(pl).sort()).toEqual(keyPaths(en).sort());
  });

  it('contain no empty strings', () => {
    const leaves = [en, pl].flatMap((messages) => keyPaths(messages));
    expect(leaves.length).toBeGreaterThan(0);
    expect(JSON.stringify([en, pl])).not.toContain('""');
  });
});
