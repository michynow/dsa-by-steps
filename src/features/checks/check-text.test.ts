import en from './messages/en.json';
import pl from './messages/pl.json';

describe('check messages', () => {
  it('define the same keys in every Locale', () => {
    expect(Object.keys(pl).sort()).toEqual(Object.keys(en).sort());
  });

  it('contain no empty strings', () => {
    const texts = [...Object.values(en), ...Object.values(pl)];
    expect(texts.filter((text) => text.trim() === '')).toEqual([]);
  });
});
