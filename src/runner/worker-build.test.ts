import { build } from 'vite';

const root = process.cwd() + '/';
const workerLimitBytes = 200_000;

interface Emitted {
  readonly fileName: string;
  readonly text: string;
}

async function emittedFiles(): Promise<readonly Emitted[]> {
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
  return outputs.flatMap((output) =>
    'output' in output
      ? output.output.map((item) => ({
          fileName: item.fileName,
          text:
            item.type === 'chunk'
              ? item.code
              : typeof item.source === 'string'
                ? item.source
                : new TextDecoder().decode(item.source),
        }))
      : [],
  );
}

describe('worker bundling', () => {
  it('emits one small exercise worker chunk that does not bundle the TypeScript compiler', async () => {
    const files = await emittedFiles();
    const workers = files.filter((file) => file.fileName.includes('exercise.worker'));
    expect(workers.map((file) => file.fileName)).toEqual([
      expect.stringMatching(/^assets\/exercise\.worker-.*\.js$/),
    ]);
    expect(workers.map((file) => file.text.length < workerLimitBytes)).toEqual([true]);
    expect(workers.map((file) => file.text.includes('transpileModule'))).toEqual([false]);
  }, 60_000);
});
