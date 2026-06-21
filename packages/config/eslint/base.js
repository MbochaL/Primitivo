import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';

/**
 * Configuración base de ESLint (flat config) compartida por todo el monorepo.
 * Los paquetes y apps la importan y la extienden con sus reglas propias.
 */
export default tseslint.config(
  {
    ignores: ['dist/**', 'build/**', 'web-build/**', '.expo/**', '**/generated/**'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  prettier,
);
