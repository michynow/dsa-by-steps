import { transpile } from './transpile';

describe('transpile', () => {
  it('strips types into JavaScript that runs', () => {
    const result = transpile(
      'function double(n: number): number { return n * 2; }\nreturn double(21);',
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(Reflect.apply(new Function(result.value), undefined, [])).toBe(42);
    expect(result.value).not.toContain('number');
  });

  it('reports a syntax error with line and column', () => {
    expect(transpile('const a = 1;\nconst b = ;\n')).toEqual({
      ok: false,
      error: { message: 'Expression expected.', line: 2, column: 11 },
    });
  });
});
