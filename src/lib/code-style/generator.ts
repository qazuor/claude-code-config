/**
 * Code style configuration file generators
 * Generates configuration files based on user options
 */

import type {
  BiomeOptions,
  CommitlintOptions,
  EditorConfigOptions,
  PrettierOptions,
} from '../../types/config.js';

/**
 * Generate .editorconfig content
 */
export function generateEditorConfig(options: EditorConfigOptions): string {
  const indent =
    options.indentStyle === 'tab' ? 'indent_style = tab' : `indent_style = space`;
  const indentSize =
    options.indentStyle === 'tab'
      ? `tab_width = ${options.indentSize}`
      : `indent_size = ${options.indentSize}`;

  const maxLine =
    options.maxLineLength === 'off' ? '' : `max_line_length = ${options.maxLineLength}`;

  return `# EditorConfig - https://editorconfig.org
root = true

[*]
${indent}
${indentSize}
end_of_line = ${options.endOfLine}
charset = ${options.charset}
trim_trailing_whitespace = ${options.trimTrailingWhitespace}
insert_final_newline = ${options.insertFinalNewline}
${maxLine}

[*.md]
trim_trailing_whitespace = false

[*.{yml,yaml}]
indent_size = 2

[Makefile]
indent_style = tab
`.trim();
}

/**
 * Generate biome.json content
 */
export function generateBiomeConfig(options: BiomeOptions): string {
  const config = {
    $schema: 'https://biomejs.dev/schemas/1.9.4/schema.json',
    vcs: {
      enabled: true,
      clientKind: 'git',
      useIgnoreFile: true,
    },
    files: {
      ignoreUnknown: true,
      ignore: options.ignorePatterns,
    },
    formatter: {
      enabled: true,
      indentStyle: options.formatter.indentStyle,
      indentWidth: options.formatter.indentWidth,
      lineWidth: options.formatter.lineWidth,
    },
    organizeImports: {
      enabled: options.organizeImports,
    },
    linter: {
      enabled: true,
      rules: {
        recommended: options.linter.recommended,
        correctness: options.linter.correctness
          ? { recommended: true }
          : { recommended: false },
        suspicious: options.linter.suspicious
          ? { recommended: true }
          : { recommended: false },
        style: options.linter.style ? { recommended: true } : { recommended: false },
        complexity: options.linter.complexity
          ? { recommended: true }
          : { recommended: false },
        security: options.linter.security
          ? { recommended: true }
          : { recommended: false },
        performance: options.linter.performance
          ? { recommended: true }
          : { recommended: false },
        a11y: options.linter.a11y ? { recommended: true } : { recommended: false },
      },
    },
    javascript: {
      formatter: {
        quoteStyle: options.formatter.quoteStyle,
        semicolons: options.formatter.semicolons,
        trailingCommas: options.formatter.trailingCommas,
        quoteProperties: options.formatter.quoteProperties,
        bracketSpacing: options.formatter.bracketSpacing,
        bracketSameLine: options.formatter.bracketSameLine,
        arrowParentheses: options.formatter.arrowParentheses,
      },
    },
    json: {
      formatter: {
        indentStyle: options.formatter.indentStyle,
        indentWidth: options.formatter.indentWidth,
        lineWidth: options.formatter.lineWidth,
      },
    },
  };

  return JSON.stringify(config, null, 2);
}

/**
 * Generate .prettierrc content
 */
export function generatePrettierConfig(options: PrettierOptions): string {
  const config = {
    printWidth: options.printWidth,
    tabWidth: options.tabWidth,
    useTabs: options.useTabs,
    semi: options.semi,
    singleQuote: options.singleQuote,
    jsxSingleQuote: options.jsxSingleQuote,
    trailingComma: options.trailingComma,
    bracketSpacing: options.bracketSpacing,
    bracketSameLine: options.bracketSameLine,
    arrowParens: options.arrowParens,
    endOfLine: options.endOfLine,
    proseWrap: options.proseWrap,
    htmlWhitespaceSensitivity: options.htmlWhitespaceSensitivity,
    singleAttributePerLine: options.singleAttributePerLine,
  };

  return JSON.stringify(config, null, 2);
}

/**
 * Generate .prettierignore content
 */
export function generatePrettierIgnore(): string {
  return `# Dependencies
node_modules/
.pnpm-store/

# Build outputs
dist/
build/
.next/
.nuxt/
.output/
out/

# Cache
.cache/
.turbo/
*.tsbuildinfo

# Coverage
coverage/

# IDE
.idea/
.vscode/

# Misc
*.min.js
*.min.css
package-lock.json
pnpm-lock.yaml
yarn.lock
`;
}

/**
 * Generate commitlint.config.js content
 */
export function generateCommitlintConfig(options: CommitlintOptions): string {
  const extendsArray = options.extends.map((e) => `'${e}'`).join(', ');
  const typesArray = options.types.map((t) => `'${t}'`).join(', ');

  let scopeConfig = '';
  if (options.scopes.length > 0) {
    const scopesArray = options.scopes.map((s) => `'${s}'`).join(', ');
    scopeConfig = `
    'scope-enum': [2, 'always', [${scopesArray}]],`;
  }

  const scopeRequired = options.scopeRequired
    ? `
    'scope-empty': [2, 'never'],`
    : '';

  const bodyRequired = options.bodyRequired
    ? `
    'body-empty': [2, 'never'],`
    : '';

  return `/** @type {import('@commitlint/types').UserConfig} */
export default {
  extends: [${extendsArray}],
  rules: {
    'type-enum': [2, 'always', [${typesArray}]],
    'header-max-length': [2, 'always', ${options.headerMaxLength}],
    'body-max-line-length': [2, 'always', ${options.bodyMaxLineLength}],${scopeConfig}${scopeRequired}${bodyRequired}
  },
};
`;
}

/**
 * Generate Husky commit-msg hook content
 */
export function generateHuskyCommitMsgHook(): string {
  return `#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npx --no -- commitlint --edit "\${1}"
`;
}
