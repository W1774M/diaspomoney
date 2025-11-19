import js from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';
import globals from 'globals';

// Variables globales combinées pour Node.js et Browser
const allGlobals = {
  ...globals.node,
  ...globals.browser,
  ...globals.es2021,
  // Variables supplémentaires
  React: 'readonly',
  JSX: 'readonly',
  NodeJS: 'readonly',
  global: 'readonly',
  require: 'readonly',
  module: 'readonly',
  crypto: 'readonly',
  // Variables de test
  describe: 'readonly',
  it: 'readonly',
  test: 'readonly',
  expect: 'readonly',
  beforeEach: 'readonly',
  afterEach: 'readonly',
  beforeAll: 'readonly',
  afterAll: 'readonly',
  cy: 'readonly',
  Cypress: 'readonly',
  // Variables MongoDB (pour les scripts)
  db: 'readonly',
  ObjectId: 'readonly',
  // Variables Jest
  jest: 'readonly',
};

export default [
  {
    ignores: [
      'node_modules/**',
      '.next/**',
      'out/**',
      'dist/**',
      'build/**',
      'coverage/**',
    ],
  },
  js.configs.recommended,
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: allGlobals,
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
  },
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsparser,
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: allGlobals,
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
        project: './tsconfig.json',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
    },
    rules: {
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-debugger': 'error',
      // Désactiver no-unused-vars pour TypeScript (utiliser la version TypeScript)
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      'prefer-const': 'error',
      'no-var': 'error',
      'prefer-template': 'warn',
      'object-curly-spacing': ['warn', 'always'],
      'array-bracket-spacing': ['warn', 'never'],
      'comma-dangle': ['warn', 'always-multiline'],
      semi: ['warn', 'always'],
      // Désactiver quotes pour éviter trop de warnings
      quotes: 'off',
      '@typescript-eslint/quotes': 'off',
      // Désactiver certaines règles pour les types
      'no-redeclare': 'off',
      '@typescript-eslint/no-redeclare': 'warn',
      'no-empty-pattern': 'warn',
      'no-case-declarations': 'warn',
      'no-unsafe-optional-chaining': 'warn',
      'no-useless-escape': 'warn',
      'no-irregular-whitespace': 'warn',
      'no-unreachable': 'warn',
      'no-empty': 'warn',
      'no-dupe-else-if': 'error',
      'no-global-assign': 'warn',
      // Désactiver les règles qui ne sont pas disponibles
      'import/no-anonymous-default-export': 'off',
      'react-hooks/exhaustive-deps': 'off',
    },
  },
  {
    files: ['**/*.test.{js,jsx,ts,tsx}', '**/*.spec.{js,jsx,ts,tsx}'],
    rules: {
      'no-console': 'off',
      'no-empty-pattern': 'off',
    },
  },
  {
    files: ['**/api/**/*.{js,jsx,ts,tsx}'],
    rules: {
      'no-console': 'off',
    },
  },
  {
    // Fichiers de types TypeScript - désactiver certaines règles
    files: ['**/types/**/*.ts', '**/repositories/interfaces/**/*.ts'],
    rules: {
      '@typescript-eslint/no-unused-vars': 'off',
      'no-unused-vars': 'off',
    },
  },
  {
    // Fichiers de configuration
    files: ['**/*.config.{js,mjs}', '**/postcss.config.js'],
    rules: {
      'no-undef': 'off',
    },
  },
  {
    // Scripts MongoDB
    files: ['**/docker/**/*.js', '**/scripts/**/*.js'],
    rules: {
      'no-global-assign': 'off',
    },
  },
  {
    // Fichiers de test Cypress
    files: ['**/cypress/**/*.ts', '**/tests/**/*.ts'],
    languageOptions: {
      globals: {
        ...allGlobals,
        cy: 'readonly',
        Cypress: 'readonly',
      },
    },
  },
  {
    // Fichiers d'exemples
    files: ['**/examples/**/*.ts', '**/examples/**/*.tsx'],
    rules: {
      'no-irregular-whitespace': 'off',
    },
  },
];
