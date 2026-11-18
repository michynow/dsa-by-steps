import js from '@eslint/js';
import boundaries from 'eslint-plugin-boundaries';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import prettier from 'eslint-config-prettier';
import globals from 'globals';
import { defineConfig } from 'eslint/config';
import tseslint from 'typescript-eslint';
import { localRules } from './eslint/local-rules.ts';

const layers = ['app', 'feature', 'renderer', 'runner', 'domain', 'content', 'ui', 'test-support'];

const publicSurface = { fileInternalPath: ['index.ts', 'index.tsx'] };

export default defineConfig(
  { ignores: ['dist', 'coverage', 'playwright-report', 'test-results', '.claude/worktrees'] },
  js.configs.recommended,
  tseslint.configs.strictTypeChecked,
  tseslint.configs.stylisticTypeChecked,
  {
    languageOptions: {
      ecmaVersion: 2023,
      globals: { ...globals.browser },
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
    plugins: { local: localRules },
    rules: {
      'local/no-comments': 'error',
      'no-restricted-exports': [
        'error',
        {
          restrictDefaultExports: {
            direct: true,
            named: true,
            defaultFrom: true,
            namedFrom: true,
            namespaceFrom: true,
          },
        },
      ],
      '@typescript-eslint/consistent-type-assertions': ['error', { assertionStyle: 'never' }],
      '@typescript-eslint/switch-exhaustiveness-check': [
        'error',
        { considerDefaultExhaustiveForUnions: false, requireDefaultForNonUnion: true },
      ],
      '@typescript-eslint/explicit-module-boundary-types': 'error',
      '@typescript-eslint/prefer-readonly': 'error',
      'func-style': ['error', 'declaration', { allowArrowFunctions: true }],
      'max-lines-per-function': ['error', { max: 60, skipBlankLines: true }],
      complexity: ['error', 10],
      eqeqeq: 'error',
      'no-console': 'error',
    },
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    plugins: { boundaries },
    settings: {
      'import/resolver': { typescript: { alwaysTryTypes: true, project: './tsconfig.app.json' } },
      'boundaries/elements': [
        { type: 'app', pattern: 'src/app' },
        { type: 'feature', pattern: 'src/features/*', capture: ['feature'] },
        { type: 'renderer', pattern: 'src/renderer' },
        { type: 'runner', pattern: 'src/runner' },
        { type: 'domain', pattern: 'src/domain' },
        { type: 'content', pattern: 'src/content' },
        { type: 'ui', pattern: 'src/ui' },
        { type: 'test-support', pattern: 'src/test' },
      ],
      'boundaries/files': [{ pattern: 'src/**/*.test.{ts,tsx}', category: 'test' }],
    },
    rules: {
      'boundaries/no-unknown-files': 'error',
      'boundaries/dependencies': [
        'error',
        {
          default: 'disallow',
          policies: [
            { allow: { dependency: { relationship: { to: 'internal' } } } },
            {
              from: { file: { categories: 'test' } },
              allow: { to: { element: { type: 'test-support' } } },
            },
            {
              from: { element: { type: 'test-support' } },
              allow: { to: { element: { type: 'domain', ...publicSurface } } },
            },
            {
              from: { element: { type: 'renderer' } },
              allow: { to: { element: { types: ['domain', 'ui'], ...publicSurface } } },
            },
            {
              from: { element: { type: 'runner' } },
              allow: { to: { element: { type: 'domain', ...publicSurface } } },
            },
            {
              from: { element: { type: 'content' } },
              allow: {
                to: { element: { type: 'domain', ...publicSurface } },
                dependency: { kind: 'type' },
              },
            },
            {
              from: { element: { type: 'feature' } },
              allow: {
                to: {
                  element: {
                    types: ['domain', 'renderer', 'runner', 'ui', 'content', 'feature'],
                    ...publicSurface,
                  },
                },
              },
            },
            {
              from: { element: { type: 'app' } },
              allow: { to: { element: { types: layers, ...publicSurface } } },
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/**/*.tsx'],
    ...reactHooks.configs.flat['recommended-latest'],
  },
  {
    files: ['src/**/*.tsx'],
    ...jsxA11y.flatConfigs.strict,
    plugins: { ...jsxA11y.flatConfigs.strict.plugins, 'react-refresh': reactRefresh },
    rules: {
      ...jsxA11y.flatConfigs.strict.rules,
      'react-refresh/only-export-components': 'error',
      'no-restricted-syntax': [
        'error',
        {
          selector: 'JSXText[value=/\\S/]',
          message: 'Render Learner-facing text from Locale messages.',
        },
        {
          selector: 'JSXAttribute[name.name=/^(aria-label|title|alt|placeholder)$/] > Literal',
          message: 'Render Learner-facing text from Locale messages.',
        },
      ],
    },
  },
  {
    files: ['src/**/*.test.{ts,tsx}', 'src/test/**', 'e2e/**'],
    rules: {
      '@typescript-eslint/consistent-type-assertions': 'off',
      'max-lines-per-function': 'off',
      'no-restricted-syntax': 'off',
    },
  },
  {
    files: ['*.config.ts', 'eslint/**'],
    languageOptions: { globals: { ...globals.node } },
    rules: { 'no-restricted-exports': 'off' },
  },
  prettier,
);
