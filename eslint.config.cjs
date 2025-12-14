// eslint.config.cjs
const eslint = require('@eslint/js');
const tseslint = require('typescript-eslint');

module.exports = tseslint.config(
  {
    ignores: ['out/**', '.vscode-test/**'],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
);
