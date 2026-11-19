import { transpile } from './transpile';

describe('transpile', () => {
  it('strips types into JavaScript that runs', async () => {
    const result = await transpile(
      'function double(n: number): number { return n * 2; }\nreturn double(21);',
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(Reflect.apply(new Function(result.value), undefined, [])).toBe(42);
    expect(result.value).not.toContain('number');
  });

  it('reports a syntax error with line and column', async () => {
    expect(await transpile('const a = 1;\nconst b = ;\n')).toEqual({
      ok: false,
      error: { message: 'Expression expected.', line: 2, column: 11 },
    });
  });

  it.each([
    ['import', 'const a = 1;\nimport { x } from "y";\n', 2, 1],
    ['export declaration', 'export function f() {}\n', 1, 1],
    ['export list', 'const a = 1;\n  export { a };\n', 2, 3],
    ['export default', 'export default 1;\n', 1, 1],
  ])('rejects %s statements with their position', async (_name, source, line, column) => {
    expect(await transpile(source)).toEqual({
      ok: false,
      error: { message: 'Import and export statements are not supported', line, column },
    });
  });

  it('loads the compiler once', async () => {
    const [first, second] = await Promise.all([
      transpile('const a = 1;'),
      transpile('const b = 2;'),
    ]);
    expect([first.ok, second.ok]).toEqual([true, true]);
  });
});
