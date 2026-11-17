import js from '@eslint/js';

export default [js.configs.recommended, {
    files: ['extension.js', 'search.js', 'test/*.js'],
    languageOptions: { globals: { SillyTavern: 'readonly', document: 'readonly', URL: 'readonly' } },
}, { ignores: ['index.js', 'node_modules/**'] }];
