import { formatMessage } from './format-message';

describe('formatMessage', () => {
  it('fills named placeholders and keeps unknown ones', () => {
    expect(formatMessage('{a} of {b} {c}', { a: '1', b: '2' })).toBe('1 of 2 {c}');
  });
});
