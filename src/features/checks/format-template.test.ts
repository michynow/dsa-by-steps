import { formatTemplate } from './format-template';

describe('formatTemplate', () => {
  it('replaces every occurrence of a repeated placeholder', () => {
    expect(formatTemplate('{n} of {max}, {n} again', { n: '1', max: '3' })).toBe('1 of 3, 1 again');
  });
});
