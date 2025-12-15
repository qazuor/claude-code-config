/**
 * Standards category definitions with options for the wizard
 */

import type { StandardsCategory, StandardsCategoryDefinition } from '../../types/standards.js';

/**
 * Code standards category definition
 */
export const CODE_STANDARDS_DEFINITION: StandardsCategoryDefinition = {
  id: 'code',
  name: 'Code Standards',
  description: 'Code style, formatting, and TypeScript conventions',
  icon: '📝',
  options: [
    {
      id: 'indentStyle',
      label: 'Indent Style',
      description: 'Use spaces or tabs for indentation',
      type: 'select',
      choices: [
        { name: 'Spaces', value: 'space', description: 'Standard for most projects' },
        { name: 'Tabs', value: 'tab', description: 'Better for accessibility' },
      ],
      affectsPlaceholders: ['{{INDENT_STYLE}}'],
    },
    {
      id: 'indentSize',
      label: 'Indent Size',
      description: 'Number of spaces/tab width',
      type: 'select',
      choices: [
        { name: '2 spaces', value: '2', description: 'Most common in JS/TS' },
        { name: '4 spaces', value: '4', description: 'More readable for some' },
      ],
      affectsPlaceholders: ['{{INDENT_SIZE}}'],
    },
    {
      id: 'maxLineLength',
      label: 'Max Line Length',
      description: 'Maximum characters per line',
      type: 'select',
      choices: [
        { name: '80 characters', value: '80', description: 'Classic terminal width' },
        { name: '100 characters', value: '100', description: 'Modern balance' },
        { name: '120 characters', value: '120', description: 'Wide screens' },
      ],
      affectsPlaceholders: ['{{MAX_LINE_LENGTH}}'],
    },
    {
      id: 'maxFileLines',
      label: 'Max File Lines',
      description: 'Maximum lines per file (excluding tests, docs, JSON)',
      type: 'select',
      choices: [
        { name: '300 lines', value: '300', description: 'Very strict' },
        { name: '500 lines', value: '500', description: 'Recommended' },
        { name: '800 lines', value: '800', description: 'Relaxed' },
        { name: '1000 lines', value: '1000', description: 'Very relaxed' },
      ],
      affectsPlaceholders: ['{{MAX_FILE_LINES}}'],
    },
    {
      id: 'quoteStyle',
      label: 'Quote Style',
      description: 'Single or double quotes for strings',
      type: 'select',
      choices: [
        { name: 'Single quotes', value: 'single', description: "const x = 'hello'" },
        { name: 'Double quotes', value: 'double', description: 'const x = "hello"' },
      ],
      affectsPlaceholders: ['{{QUOTE_STYLE}}'],
    },
    {
      id: 'semicolons',
      label: 'Semicolons',
      description: 'Use semicolons at end of statements',
      type: 'boolean',
      affectsPlaceholders: ['{{USE_SEMICOLONS}}'],
    },
    {
      id: 'trailingCommas',
      label: 'Trailing Commas',
      description: 'Add trailing commas in multiline constructs',
      type: 'select',
      choices: [
        { name: 'ES5', value: 'es5', description: 'Where valid in ES5 (objects, arrays)' },
        { name: 'All', value: 'all', description: 'Everywhere possible' },
        { name: 'None', value: 'none', description: 'No trailing commas' },
      ],
      affectsPlaceholders: ['{{TRAILING_COMMAS}}'],
    },
    {
      id: 'allowAny',
      label: 'Allow "any" Type',
      description: 'Allow the "any" type in TypeScript',
      type: 'boolean',
      affectsPlaceholders: ['{{ALLOW_ANY}}'],
    },
    {
      id: 'namedExportsOnly',
      label: 'Named Exports Only',
      description: 'Require named exports (no default exports)',
      type: 'boolean',
      affectsPlaceholders: ['{{NAMED_EXPORTS_ONLY}}'],
    },
    {
      id: 'roroPattern',
      label: 'RO-RO Pattern',
      description: 'Require Receive Object, Return Object pattern',
      type: 'boolean',
      affectsPlaceholders: ['{{RORO_PATTERN}}'],
    },
    {
      id: 'jsDocRequired',
      label: 'JSDoc Required',
      description: 'Require JSDoc for all exports',
      type: 'boolean',
      affectsPlaceholders: ['{{JSDOC_REQUIRED}}'],
    },
  ],
  targetFiles: ['code-standards.md', 'architecture-patterns.md'],
};

/**
 * Testing standards category definition
 */
export const TESTING_STANDARDS_DEFINITION: StandardsCategoryDefinition = {
  id: 'testing',
  name: 'Testing Standards',
  description: 'Test coverage, TDD, and testing methodology',
  icon: '🧪',
  options: [
    {
      id: 'coverageTarget',
      label: 'Coverage Target',
      description: 'Minimum code coverage percentage',
      type: 'select',
      choices: [
        { name: '60%', value: '60', description: 'Minimum viable' },
        { name: '70%', value: '70', description: 'Relaxed' },
        { name: '80%', value: '80', description: 'Standard' },
        { name: '90%', value: '90', description: 'Strict' },
        { name: '95%', value: '95', description: 'Enterprise' },
      ],
      affectsPlaceholders: ['{{COVERAGE_TARGET}}'],
    },
    {
      id: 'tddRequired',
      label: 'TDD Required',
      description: 'Require Test-Driven Development (Red-Green-Refactor)',
      type: 'boolean',
      affectsPlaceholders: ['{{TDD_REQUIRED}}'],
    },
    {
      id: 'testPattern',
      label: 'Test Pattern',
      description: 'Test structure pattern',
      type: 'select',
      choices: [
        { name: 'AAA', value: 'aaa', description: 'Arrange-Act-Assert' },
        { name: 'GWT', value: 'gwt', description: 'Given-When-Then' },
      ],
      affectsPlaceholders: ['{{TEST_PATTERN}}'],
    },
    {
      id: 'testLocation',
      label: 'Test Location',
      description: 'Where to place test files',
      type: 'select',
      choices: [
        { name: 'Separate', value: 'separate', description: 'test/ folder at root' },
        { name: 'Colocated', value: 'colocated', description: '__tests__ near source' },
      ],
      affectsPlaceholders: ['{{TEST_LOCATION}}'],
    },
    {
      id: 'unitTestMaxMs',
      label: 'Unit Test Max (ms)',
      description: 'Maximum milliseconds per unit test',
      type: 'select',
      choices: [
        { name: '50ms', value: '50', description: 'Very fast' },
        { name: '100ms', value: '100', description: 'Standard' },
        { name: '200ms', value: '200', description: 'Relaxed' },
      ],
      affectsPlaceholders: ['{{UNIT_TEST_MAX_MS}}'],
    },
    {
      id: 'integrationTestMaxMs',
      label: 'Integration Test Max (ms)',
      description: 'Maximum milliseconds per integration test',
      type: 'select',
      choices: [
        { name: '500ms', value: '500', description: 'Fast' },
        { name: '1000ms', value: '1000', description: 'Standard' },
        { name: '2000ms', value: '2000', description: 'Relaxed' },
      ],
      affectsPlaceholders: ['{{INTEGRATION_TEST_MAX_MS}}'],
    },
  ],
  targetFiles: ['testing-standards.md'],
};

/**
 * Documentation standards category definition
 */
export const DOCUMENTATION_STANDARDS_DEFINITION: StandardsCategoryDefinition = {
  id: 'documentation',
  name: 'Documentation Standards',
  description: 'JSDoc, comments, and changelog conventions',
  icon: '📚',
  options: [
    {
      id: 'jsDocLevel',
      label: 'JSDoc Level',
      description: 'Level of detail in JSDoc comments',
      type: 'select',
      choices: [
        { name: 'Minimal', value: 'minimal', description: 'Brief description only' },
        { name: 'Standard', value: 'standard', description: 'Description + params + returns' },
        { name: 'Comprehensive', value: 'comprehensive', description: 'Full docs with examples' },
      ],
      affectsPlaceholders: ['{{JSDOC_LEVEL}}'],
    },
    {
      id: 'requireExamples',
      label: 'Require Examples',
      description: 'Require @example in JSDoc',
      type: 'boolean',
      affectsPlaceholders: ['{{REQUIRE_EXAMPLES}}'],
    },
    {
      id: 'changelogFormat',
      label: 'Changelog Format',
      description: 'Changelog format to follow',
      type: 'select',
      choices: [
        { name: 'Conventional', value: 'conventional', description: 'Auto-generated from commits' },
        { name: 'Keep a Changelog', value: 'keepachangelog', description: 'Manual, semantic' },
      ],
      affectsPlaceholders: ['{{CHANGELOG_FORMAT}}'],
    },
    {
      id: 'inlineCommentPolicy',
      label: 'Inline Comment Policy',
      description: 'Policy for inline code comments',
      type: 'select',
      choices: [
        {
          name: 'Why not What',
          value: 'why-not-what',
          description: 'Explain reasoning, not obvious',
        },
        { name: 'Minimal', value: 'minimal', description: 'Only when necessary' },
        { name: 'Extensive', value: 'extensive', description: 'Comment thoroughly' },
      ],
      affectsPlaceholders: ['{{INLINE_COMMENT_POLICY}}'],
    },
  ],
  targetFiles: ['documentation-standards.md'],
};

/**
 * Design standards category definition
 */
export const DESIGN_STANDARDS_DEFINITION: StandardsCategoryDefinition = {
  id: 'design',
  name: 'Design Standards',
  description: 'UI/UX, CSS, and accessibility standards',
  icon: '🎨',
  options: [
    {
      id: 'cssFramework',
      label: 'CSS Framework',
      description: 'CSS/styling approach',
      type: 'select',
      choices: [
        { name: 'Tailwind CSS', value: 'tailwind', description: 'Utility-first CSS' },
        { name: 'CSS Modules', value: 'css-modules', description: 'Scoped CSS' },
        { name: 'Styled Components', value: 'styled-components', description: 'CSS-in-JS' },
        { name: 'Vanilla CSS', value: 'vanilla', description: 'Plain CSS' },
      ],
      affectsPlaceholders: ['{{CSS_FRAMEWORK}}'],
    },
    {
      id: 'componentLibrary',
      label: 'Component Library',
      description: 'UI component library',
      type: 'select',
      choices: [
        { name: 'shadcn/ui', value: 'shadcn', description: 'Copy-paste components' },
        { name: 'Radix UI', value: 'radix', description: 'Unstyled primitives' },
        { name: 'Headless UI', value: 'headless', description: 'Unstyled, accessible' },
        { name: 'None', value: 'none', description: 'Build from scratch' },
      ],
      affectsPlaceholders: ['{{COMPONENT_LIBRARY}}'],
    },
    {
      id: 'accessibilityLevel',
      label: 'Accessibility Level',
      description: 'WCAG accessibility compliance level',
      type: 'select',
      choices: [
        { name: 'Level A', value: 'A', description: 'Minimum' },
        { name: 'Level AA', value: 'AA', description: 'Standard (recommended)' },
        { name: 'Level AAA', value: 'AAA', description: 'Highest' },
      ],
      affectsPlaceholders: ['{{WCAG_LEVEL}}', '{{ACCESSIBILITY_LEVEL}}'],
    },
    {
      id: 'darkModeSupport',
      label: 'Dark Mode Support',
      description: 'Support dark mode theme',
      type: 'boolean',
      affectsPlaceholders: ['{{DARK_MODE_SUPPORT}}'],
    },
  ],
  targetFiles: ['design-standards.md'],
};

/**
 * Security standards category definition
 */
export const SECURITY_STANDARDS_DEFINITION: StandardsCategoryDefinition = {
  id: 'security',
  name: 'Security Standards',
  description: 'Authentication, validation, and security practices',
  icon: '🔒',
  options: [
    {
      id: 'authPattern',
      label: 'Auth Pattern',
      description: 'Authentication approach',
      type: 'select',
      choices: [
        { name: 'JWT', value: 'jwt', description: 'JSON Web Tokens' },
        { name: 'Session', value: 'session', description: 'Server-side sessions' },
        { name: 'OAuth', value: 'oauth', description: 'OAuth 2.0 / OIDC' },
        { name: 'None', value: 'none', description: 'No authentication' },
      ],
      affectsPlaceholders: ['{{AUTH_PATTERN}}'],
    },
    {
      id: 'inputValidation',
      label: 'Input Validation',
      description: 'Validation library',
      type: 'select',
      choices: [
        { name: 'Zod', value: 'zod', description: 'TypeScript-first validation' },
        { name: 'Yup', value: 'yup', description: 'Schema builder' },
        { name: 'Joi', value: 'joi', description: 'Data validation' },
        { name: 'Manual', value: 'manual', description: 'Custom validation' },
      ],
      affectsPlaceholders: ['{{VALIDATION_LIBRARY}}', '{{INPUT_VALIDATION}}'],
    },
    {
      id: 'csrfProtection',
      label: 'CSRF Protection',
      description: 'Enable Cross-Site Request Forgery protection',
      type: 'boolean',
      affectsPlaceholders: ['{{CSRF_PROTECTION}}'],
    },
    {
      id: 'rateLimiting',
      label: 'Rate Limiting',
      description: 'Enable API rate limiting',
      type: 'boolean',
      affectsPlaceholders: ['{{RATE_LIMITING}}'],
    },
  ],
  targetFiles: ['security-standards.md'],
};

/**
 * Performance standards category definition
 */
export const PERFORMANCE_STANDARDS_DEFINITION: StandardsCategoryDefinition = {
  id: 'performance',
  name: 'Performance Standards',
  description: 'Core Web Vitals and performance targets',
  icon: '⚡',
  options: [
    {
      id: 'lcpTarget',
      label: 'LCP Target (ms)',
      description: 'Largest Contentful Paint target',
      type: 'select',
      choices: [
        { name: '1500ms', value: '1500', description: 'Excellent' },
        { name: '2000ms', value: '2000', description: 'Good' },
        { name: '2500ms', value: '2500', description: 'Standard' },
        { name: '4000ms', value: '4000', description: 'Needs improvement' },
      ],
      affectsPlaceholders: ['{{LCP_TARGET}}'],
    },
    {
      id: 'fidTarget',
      label: 'FID Target (ms)',
      description: 'First Input Delay target',
      type: 'select',
      choices: [
        { name: '50ms', value: '50', description: 'Excellent' },
        { name: '100ms', value: '100', description: 'Good' },
        { name: '200ms', value: '200', description: 'Standard' },
        { name: '300ms', value: '300', description: 'Needs improvement' },
      ],
      affectsPlaceholders: ['{{FID_TARGET}}'],
    },
    {
      id: 'clsTarget',
      label: 'CLS Target',
      description: 'Cumulative Layout Shift target',
      type: 'select',
      choices: [
        { name: '0.05', value: '0.05', description: 'Excellent' },
        { name: '0.1', value: '0.1', description: 'Good' },
        { name: '0.15', value: '0.15', description: 'Standard' },
        { name: '0.25', value: '0.25', description: 'Needs improvement' },
      ],
      affectsPlaceholders: ['{{CLS_TARGET}}'],
    },
    {
      id: 'bundleSizeTargetKb',
      label: 'Bundle Size (KB)',
      description: 'Maximum initial bundle size',
      type: 'select',
      choices: [
        { name: '100KB', value: '100', description: 'Very strict' },
        { name: '150KB', value: '150', description: 'Strict' },
        { name: '250KB', value: '250', description: 'Standard' },
        { name: '500KB', value: '500', description: 'Relaxed' },
      ],
      affectsPlaceholders: ['{{BUNDLE_SIZE_TARGET}}'],
    },
    {
      id: 'apiResponseTargetMs',
      label: 'API Response (ms)',
      description: 'Maximum API response time',
      type: 'select',
      choices: [
        { name: '100ms', value: '100', description: 'Very fast' },
        { name: '200ms', value: '200', description: 'Fast' },
        { name: '300ms', value: '300', description: 'Standard' },
        { name: '500ms', value: '500', description: 'Relaxed' },
      ],
      affectsPlaceholders: ['{{API_RESPONSE_TARGET}}'],
    },
  ],
  targetFiles: ['performance-standards.md'],
};

/**
 * All standards category definitions
 */
export const STANDARDS_DEFINITIONS: Record<StandardsCategory, StandardsCategoryDefinition> = {
  code: CODE_STANDARDS_DEFINITION,
  testing: TESTING_STANDARDS_DEFINITION,
  documentation: DOCUMENTATION_STANDARDS_DEFINITION,
  design: DESIGN_STANDARDS_DEFINITION,
  security: SECURITY_STANDARDS_DEFINITION,
  performance: PERFORMANCE_STANDARDS_DEFINITION,
};

/**
 * Get all placeholder patterns used in standards
 */
export function getAllStandardsPlaceholders(): string[] {
  const placeholders = new Set<string>();

  for (const category of Object.values(STANDARDS_DEFINITIONS)) {
    for (const option of category.options) {
      for (const placeholder of option.affectsPlaceholders) {
        placeholders.add(placeholder);
      }
    }
  }

  return Array.from(placeholders).sort();
}

/**
 * Get all target files for standards
 */
export function getAllStandardsTargetFiles(): string[] {
  const files = new Set<string>();

  for (const category of Object.values(STANDARDS_DEFINITIONS)) {
    for (const file of category.targetFiles) {
      files.add(file);
    }
  }

  return Array.from(files).sort();
}
