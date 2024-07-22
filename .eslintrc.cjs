module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true
  },
  extends: [
    'eslint:recommended',
    'plugin:import/recommended', 
    'plugin:import/typescript',
    'plugin:@typescript-eslint/strict-type-checked',
    'prettier'
  ],
  overrides: [],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: './tsconfig.json'
  },
  plugins: [
    "@typescript-eslint", 
    "import"
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
    "sort-imports": [
      "warn",
      {
        ignoreCase: false,
        ignoreDeclarationSort: true, // don"t want to sort import lines, use eslint-plugin-import instead
        ignoreMemberSort: false,
        memberSyntaxSortOrder: ['none', 'all', 'multiple', 'single'],
        allowSeparatedGroups: true,
      },
    ],
    
    "import/no-unresolved": "error",
    "import/newline-after-import": [
      "warn", 
      { 
        "count": 1
      }
    ],
    'import/order': [
      'warn',
      {
        groups: [
          'builtin', // Built-in imports (come from NodeJS native) go first
          'external', // <- External imports
          'internal', // <- Absolute imports
          ['sibling', 'parent'], // <- Relative imports, the sibling and parent types they can be mingled together
          'index', // <- index imports
          'unknown', // <- unknown
        ],
        'newlines-between': 'ignore',
        alphabetize: {
          /* sort in ascending order. Options: ["ignore", "asc", "desc"] */
          order: 'asc',
          /* ignore case. Options: [true, false] */
          caseInsensitive: true,
        },
      },
    ]
  },
  settings: {
    "import/parsers": {
      "@typescript-eslint/parser": [".ts", ".tsx"]
    },
    "import/resolver": {
      "typescript": true
    }
  }
}