declare module 'eslint-plugin-jsx-a11y' {
  import type { ESLint, Linter } from 'eslint';

  interface FlatConfig extends Linter.Config {
    readonly plugins: Record<string, ESLint.Plugin>;
    readonly rules: Linter.RulesRecord;
  }

  const plugin: ESLint.Plugin & {
    readonly flatConfigs: { readonly recommended: FlatConfig; readonly strict: FlatConfig };
  };

  export default plugin;
}
