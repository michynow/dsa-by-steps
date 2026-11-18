import en from './messages/en.json';
import pl from './messages/pl.json';

function leaves(value: unknown, prefix = ''): readonly (readonly [string, unknown])[] {
  if (typeof value !== 'object' || value === null) return [[prefix, value]];
  return Object.entries(value).flatMap(([key, child]) =>
    leaves(child, prefix === '' ? key : `${prefix}.${key}`),
  );
}

describe('lesson-player messages', () => {
  it('define the same keys in every Locale', () => {
    const keys = (messages: unknown) =>
      leaves(messages)
        .map(([key]) => key)
        .sort();
    expect(keys(pl)).toEqual(keys(en));
  });

  it('hold only non-empty strings', () => {
    const values = [...leaves(en), ...leaves(pl)].map(([, value]) => value);
    expect(values.every((value) => typeof value === 'string' && value.trim() !== '')).toBe(true);
  });
});
