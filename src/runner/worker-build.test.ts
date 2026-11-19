import { build } from 'vite';

const root = process.cwd() + '/';

describe('worker bundling', () => {
  it('emits the exercise worker as its own chunk', async () => {
    const result = await build({
      root,
      configFile: root + 'vite.config.ts',
      logLevel: 'silent',
      build: {
        write: false,
        lib: { entry: root + 'src/runner/index.ts', formats: ['es'], fileName: 'runner' },
      },
    });
    const outputs = Array.isArray(result) ? result : [result];
    const files = outputs.flatMap((o) =>
      'output' in o ? o.output.map((chunk) => chunk.fileName) : [],
    );
    expect(files.filter((name) => name.includes('exercise.worker'))).toEqual([
      expect.stringMatching(/^assets\/exercise\.worker-.*\.js$/),
    ]);
  }, 60_000);
});
