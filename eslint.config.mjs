// eslint.config.mjs
import js from '@eslint/js';
import typescriptPlugin from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import nextPlugin from '@next/eslint-plugin-next';
import globals from 'globals';
import { FlatCompat } from '@eslint/eslintrc';

const compat = new FlatCompat({
  baseDirectory: import.meta.dirname,
});

export default [
  // Next.js recommended (via compat for flat config)
  ...compat.extends('next/core-web-vitals'),

  // Base JS rules
  js.configs.recommended,

  // Main config
  {
    files: ['**/*.{ts,tsx,js,jsx,mjs,cjs}'],
    plugins: {
      '@typescript-eslint': typescriptPlugin,
      react,
      'react-hooks': reactHooks,
      'jsx-a11y': jsxA11y,
      '@next/next': nextPlugin,
    },
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
        project: './tsconfig.json',
        tsconfigRootDir: import.meta.dirname,
      },
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    settings: {
      react: { version: 'detect' },
    },
    rules: {
      // --- Turn off core rules that fight TypeScript ---
      'no-undef': 'off',
      'no-unused-vars': 'off',

      // --- TypeScript rules (keep as warnings for now) ---
      '@typescript-eslint/no-unused-vars': ['warn', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_',
      }],
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-require-imports': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-floating-promises': 'off',
      '@typescript-eslint/no-misused-promises': 'off',

      // --- React rules ---
      'react/react-in-jsx-scope': 'off',
      'react/no-unescaped-entities': 'off', // stop quoting/apostrophe noise
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',

      // --- General ---
      'no-case-declarations': 'off',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-debugger': 'error',
      'prefer-const': 'warn',
    },
  },

  // Server/API overrides (explicit Node context)
  {
    files: [
      'app/**/route.{ts,tsx,js,jsx}',
      'pages/api/**/*.{ts,js}',
      'app/api/**/*.{ts,js}',
      'scripts/**/*.{ts,js}',
      'prisma/**/*.{ts,js}',
    ],
    languageOptions: {
      globals: { ...globals.node },
    },
  },

  // Ignores
  {
    ignores: [
      'node_modules/**',
      '.next/**',
      'out/**',
      'build/**',
      'dist/**',
      '*.config.js',
      '*.config.mjs',
      '*.config.ts',
      'ios/**',
      'android/**',
      'temp-cleanup/**',
    ],
  },
];
