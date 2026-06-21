import base from '@primitivo/config/eslint/base.js';

export default [
  ...base,
  {
    // El código de src/generated lo produce openapi-typescript-codegen; no se lintea.
    ignores: ['src/generated/**'],
  },
];
