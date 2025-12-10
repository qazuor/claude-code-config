/**
 * Commitlint configuration
 * https://commitlint.js.org
 *
 * Install dependencies:
 *   pnpm add -D @commitlint/cli @commitlint/config-conventional
 *
 * Usage with Husky:
 *   npx husky add .husky/commit-msg 'npx --no -- commitlint --edit ${1}'
 */

export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // Type must be one of the following
    'type-enum': [
      2,
      'always',
      [
        'feat', // New feature
        'fix', // Bug fix
        'docs', // Documentation only changes
        'style', // Code style (formatting, semicolons, etc)
        'refactor', // Code refactoring
        'perf', // Performance improvements
        'test', // Adding or updating tests
        'build', // Build system or external dependencies
        'ci', // CI configuration
        'chore', // Other changes (maintenance, tooling)
        'revert', // Revert a previous commit
      ],
    ],
    // Type must be lowercase
    'type-case': [2, 'always', 'lower-case'],
    // Subject must not be empty
    'subject-empty': [2, 'never'],
    // Subject must not end with period
    'subject-full-stop': [2, 'never', '.'],
    // Header max length
    'header-max-length': [2, 'always', 100],
    // Body max line length
    'body-max-line-length': [2, 'always', 200],
  },
};
