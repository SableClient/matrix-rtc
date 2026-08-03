import { defineConfig } from 'oxlint';

export default defineConfig({
  options: {
    typeAware: true,
  },
  plugins: ['typescript', 'import', 'unicorn', 'oxc', 'vitest', 'promise'],
  categories: {
    correctness: 'error',
    suspicious: 'warn',
    perf: 'warn',
    style: 'off',
  },
  env: {
    browser: true,
    builtin: true,
  },
  rules: {
    'import/no-cycle': ['error', { maxDepth: 3 }],
    'import/no-unassigned-import': 'off',
    'no-console': ['error', { allow: ['warn', 'error'] }],
    'typescript/no-explicit-any': 'error',
    'typescript/consistent-type-imports': 'error',
    'typescript/only-throw-error': 'error',
    'typescript/no-unsafe-type-assertion': 'off',
    'typescript/no-floating-promises': 'off',
    'typescript/no-unnecessary-type-arguments': 'off',
    // Types we rely on that the matrix-js-sdk does not declare make this fire
    // on assertions that are load-bearing.
    'typescript/no-unnecessary-type-assertion': 'off',
    'oxc/no-map-spread': 'off',
    'promise/always-return': 'off',
    // The package must stay UI-free and state-free so any Matrix client can
    // consume it.
    'no-restricted-imports': [
      'error',
      {
        paths: [
          { name: 'react', message: 'matrixrtc must stay UI-free.' },
          { name: 'jotai', message: 'matrixrtc must not depend on app state.' },
          { name: 'folds', message: 'matrixrtc must stay UI-free.' },
        ],
        patterns: ['$state/*', '$utils/*', '$components/*', '$features/*', '$hooks/*'],
      },
    ],
  },
  overrides: [
    {
      files: ['**/*.ts', '**/*.cts', '**/*.mts'],
      rules: {
        'typescript/no-unused-vars': [
          'error',
          { args: 'after-used', ignoreRestSiblings: true, vars: 'all' },
        ],
        'typescript/no-shadow': 'error',
      },
    },
    {
      files: ['**/*.test.ts'],
      rules: {
        'typescript/unbound-method': 'off',
        'typescript/no-unsafe-enum-comparison': 'off',
      },
    },
  ],
});
