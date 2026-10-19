import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';

export default tseslint.config(
  { ignores: ['dist', 'coverage', 'node_modules'] },
  {
    files: ['**/*.{ts,tsx}'],
    extends: [js.configs.recommended, ...tseslint.configs.recommendedTypeChecked],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
      parserOptions: {
        // Type-aware regels hebben het TypeScript-project nodig; zonder dit
        // kan ESLint bijvoorbeeld geen niet-afgehandelde promises zien.
        project: ['./tsconfig.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      // CLAUDE.md §7: geen `any` tenzij onvermijdelijk, en dan met uitleg.
      // Een expliciete uitzondering krijgt een eslint-disable met reden.
      '@typescript-eslint/no-explicit-any': 'error',
    },
  },
  // Moet als laatste: zet opmaakregels uit die met Prettier zouden botsen.
  prettier,
);
