module.exports = {
  env: {
    browser: true,
    es2021: true
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'prettier'
  ],
  overrides: [],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: './tsconfig.json'
  },
  plugins: [
    "@typescript-eslint", 
  ],
  root: true,
  rules: {
    "@typescript-eslint/no-unused-vars": [
      "error", 
      { 
        "ignoreRestSiblings": true,
        "argsIgnorePattern": "^_",
        "varsIgnorePattern": "^_",
        "caughtErrorsIgnorePattern": "^_"
      }
    ],
    "@typescript-eslint/consistent-type-definitions": [
      "warn",
      "type"
    ],
    "@typescript-eslint/consistent-type-imports": [
      "error"
    ],
  }
}