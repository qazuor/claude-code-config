/**
 * Standards configuration prompts
 */

import {
  DEFAULT_STANDARDS_CONFIG,
  STANDARDS_PRESETS,
  type StandardsPreset,
} from '../../constants/standards-defaults.js';
import { STANDARDS_DEFINITIONS } from '../../lib/standards/definitions.js';
import { colors, logger } from '../../lib/utils/logger.js';
import { confirm, select } from '../../lib/utils/prompt-cancel.js';
import type {
  StandardsCategory,
  StandardsConfig,
  StandardsConfigCode,
  StandardsConfigDesign,
  StandardsConfigDocumentation,
  StandardsConfigPerformance,
  StandardsConfigSecurity,
  StandardsConfigTesting,
} from '../../types/standards.js';

/**
 * Prompt for complete standards configuration
 */
export async function promptStandardsConfig(options?: {
  defaults?: Partial<StandardsConfig>;
  category?: StandardsCategory;
}): Promise<StandardsConfig> {
  logger.section('Project Standards', '📐');
  logger.info('Configure quality standards for your project');
  logger.newline();

  // If specific category requested, only configure that
  if (options?.category) {
    const existingConfig = options.defaults ?? DEFAULT_STANDARDS_CONFIG;
    const categoryConfig = await promptCategoryConfig(options.category, existingConfig);
    return {
      ...existingConfig,
      [options.category]: categoryConfig,
    } as StandardsConfig;
  }

  // Ask if user wants to configure standards
  const enableStandards = await confirm({
    message: 'Would you like to configure project standards?',
    default: true,
  });

  if (!enableStandards) {
    return DEFAULT_STANDARDS_CONFIG;
  }

  // Offer preset selection
  const preset = await promptStandardsPreset();

  if (preset !== 'custom') {
    const presetConfig = STANDARDS_PRESETS[preset];
    logger.success(`Using "${presetConfig.name}" preset`);
    return presetConfig.config;
  }

  // Custom configuration - prompt for each category
  logger.newline();
  logger.info('Configure each standards category:');

  const codeConfig = await promptCodeStandards(options?.defaults?.code);
  const testingConfig = await promptTestingStandards(options?.defaults?.testing);
  const documentationConfig = await promptDocumentationStandards(options?.defaults?.documentation);
  const designConfig = await promptDesignStandards(options?.defaults?.design);
  const securityConfig = await promptSecurityStandards(options?.defaults?.security);
  const performanceConfig = await promptPerformanceStandards(options?.defaults?.performance);

  return {
    code: codeConfig,
    testing: testingConfig,
    documentation: documentationConfig,
    design: designConfig,
    security: securityConfig,
    performance: performanceConfig,
  };
}

/**
 * Prompt for standards preset selection
 */
async function promptStandardsPreset(): Promise<StandardsPreset> {
  return select<StandardsPreset>({
    message: 'Choose a standards preset:',
    choices: Object.entries(STANDARDS_PRESETS).map(([key, preset]) => ({
      name: `${preset.name} - ${preset.description}`,
      value: key as StandardsPreset,
    })),
    default: 'balanced',
  });
}

/**
 * Prompt for a specific category configuration
 */
async function promptCategoryConfig(
  category: StandardsCategory,
  existingConfig: Partial<StandardsConfig>
): Promise<unknown> {
  switch (category) {
    case 'code':
      return promptCodeStandards(existingConfig.code);
    case 'testing':
      return promptTestingStandards(existingConfig.testing);
    case 'documentation':
      return promptDocumentationStandards(existingConfig.documentation);
    case 'design':
      return promptDesignStandards(existingConfig.design);
    case 'security':
      return promptSecurityStandards(existingConfig.security);
    case 'performance':
      return promptPerformanceStandards(existingConfig.performance);
  }
}

/**
 * Prompt for code standards
 */
async function promptCodeStandards(
  defaults?: Partial<StandardsConfigCode>
): Promise<StandardsConfigCode> {
  const def = STANDARDS_DEFINITIONS.code;
  logger.newline();
  logger.subtitle(`${def.icon} ${def.name}`);

  const indentStyle = await select<'space' | 'tab'>({
    message: 'Indent style:',
    choices: [
      { name: 'Spaces', value: 'space' },
      { name: 'Tabs', value: 'tab' },
    ],
    default: defaults?.indentStyle ?? DEFAULT_STANDARDS_CONFIG.code.indentStyle,
  });

  const indentSize = await select<number>({
    message: 'Indent size:',
    choices: [
      { name: '2 spaces', value: 2 },
      { name: '4 spaces', value: 4 },
    ],
    default: defaults?.indentSize ?? DEFAULT_STANDARDS_CONFIG.code.indentSize,
  });

  const maxLineLength = await select<number>({
    message: 'Max line length:',
    choices: [
      { name: '80 characters', value: 80 },
      { name: '100 characters', value: 100 },
      { name: '120 characters', value: 120 },
    ],
    default: defaults?.maxLineLength ?? DEFAULT_STANDARDS_CONFIG.code.maxLineLength,
  });

  const maxFileLines = await select<number>({
    message: 'Max file lines:',
    choices: [
      { name: '300 lines (strict)', value: 300 },
      { name: '500 lines (standard)', value: 500 },
      { name: '800 lines (relaxed)', value: 800 },
    ],
    default: defaults?.maxFileLines ?? DEFAULT_STANDARDS_CONFIG.code.maxFileLines,
  });

  const quoteStyle = await select<'single' | 'double'>({
    message: 'Quote style:',
    choices: [
      { name: 'Single quotes', value: 'single' },
      { name: 'Double quotes', value: 'double' },
    ],
    default: defaults?.quoteStyle ?? DEFAULT_STANDARDS_CONFIG.code.quoteStyle,
  });

  const semicolons = await confirm({
    message: 'Use semicolons?',
    default: defaults?.semicolons ?? DEFAULT_STANDARDS_CONFIG.code.semicolons,
  });

  const trailingCommas = await select<'all' | 'es5' | 'none'>({
    message: 'Trailing commas:',
    choices: [
      { name: 'ES5 (recommended)', value: 'es5' },
      { name: 'All', value: 'all' },
      { name: 'None', value: 'none' },
    ],
    default: defaults?.trailingCommas ?? DEFAULT_STANDARDS_CONFIG.code.trailingCommas,
  });

  const allowAny = await confirm({
    message: 'Allow "any" type in TypeScript?',
    default: defaults?.allowAny ?? DEFAULT_STANDARDS_CONFIG.code.allowAny,
  });

  const namedExportsOnly = await confirm({
    message: 'Require named exports only (no default exports)?',
    default: defaults?.namedExportsOnly ?? DEFAULT_STANDARDS_CONFIG.code.namedExportsOnly,
  });

  const roroPattern = await confirm({
    message: 'Require RO-RO pattern (Receive Object, Return Object)?',
    default: defaults?.roroPattern ?? DEFAULT_STANDARDS_CONFIG.code.roroPattern,
  });

  const jsDocRequired = await confirm({
    message: 'Require JSDoc for all exports?',
    default: defaults?.jsDocRequired ?? DEFAULT_STANDARDS_CONFIG.code.jsDocRequired,
  });

  return {
    indentStyle,
    indentSize,
    maxLineLength,
    maxFileLines,
    quoteStyle,
    semicolons,
    trailingCommas,
    allowAny,
    namedExportsOnly,
    roroPattern,
    jsDocRequired,
  };
}

/**
 * Prompt for testing standards
 */
async function promptTestingStandards(
  defaults?: Partial<StandardsConfigTesting>
): Promise<StandardsConfigTesting> {
  const def = STANDARDS_DEFINITIONS.testing;
  logger.newline();
  logger.subtitle(`${def.icon} ${def.name}`);

  const coverageTarget = await select<number>({
    message: 'Minimum code coverage:',
    choices: [
      { name: '60% (startup)', value: 60 },
      { name: '70% (relaxed)', value: 70 },
      { name: '80% (standard)', value: 80 },
      { name: '90% (strict)', value: 90 },
      { name: '95% (enterprise)', value: 95 },
    ],
    default: defaults?.coverageTarget ?? DEFAULT_STANDARDS_CONFIG.testing.coverageTarget,
  });

  const tddRequired = await confirm({
    message: 'Require TDD methodology (Red-Green-Refactor)?',
    default: defaults?.tddRequired ?? DEFAULT_STANDARDS_CONFIG.testing.tddRequired,
  });

  const testPattern = await select<'aaa' | 'gwt'>({
    message: 'Test pattern:',
    choices: [
      { name: 'AAA (Arrange-Act-Assert)', value: 'aaa' },
      { name: 'GWT (Given-When-Then)', value: 'gwt' },
    ],
    default: defaults?.testPattern ?? DEFAULT_STANDARDS_CONFIG.testing.testPattern,
  });

  const testLocation = await select<'colocated' | 'separate'>({
    message: 'Test file location:',
    choices: [
      { name: 'Separate (test/ folder)', value: 'separate' },
      { name: 'Colocated (__tests__ near source)', value: 'colocated' },
    ],
    default: defaults?.testLocation ?? DEFAULT_STANDARDS_CONFIG.testing.testLocation,
  });

  const unitTestMaxMs = await select<number>({
    message: 'Max time per unit test:',
    choices: [
      { name: '50ms (fast)', value: 50 },
      { name: '100ms (standard)', value: 100 },
      { name: '200ms (relaxed)', value: 200 },
    ],
    default: defaults?.unitTestMaxMs ?? DEFAULT_STANDARDS_CONFIG.testing.unitTestMaxMs,
  });

  const integrationTestMaxMs = await select<number>({
    message: 'Max time per integration test:',
    choices: [
      { name: '500ms (fast)', value: 500 },
      { name: '1000ms (standard)', value: 1000 },
      { name: '2000ms (relaxed)', value: 2000 },
    ],
    default:
      defaults?.integrationTestMaxMs ?? DEFAULT_STANDARDS_CONFIG.testing.integrationTestMaxMs,
  });

  return {
    coverageTarget,
    tddRequired,
    testPattern,
    testLocation,
    unitTestMaxMs,
    integrationTestMaxMs,
  };
}

/**
 * Prompt for documentation standards
 */
async function promptDocumentationStandards(
  defaults?: Partial<StandardsConfigDocumentation>
): Promise<StandardsConfigDocumentation> {
  const def = STANDARDS_DEFINITIONS.documentation;
  logger.newline();
  logger.subtitle(`${def.icon} ${def.name}`);

  const jsDocLevel = await select<'minimal' | 'standard' | 'comprehensive'>({
    message: 'JSDoc detail level:',
    choices: [
      { name: 'Minimal (brief description)', value: 'minimal' },
      { name: 'Standard (description + params + returns)', value: 'standard' },
      { name: 'Comprehensive (full docs with examples)', value: 'comprehensive' },
    ],
    default: defaults?.jsDocLevel ?? DEFAULT_STANDARDS_CONFIG.documentation.jsDocLevel,
  });

  const requireExamples = await confirm({
    message: 'Require @example in JSDoc?',
    default: defaults?.requireExamples ?? DEFAULT_STANDARDS_CONFIG.documentation.requireExamples,
  });

  const changelogFormat = await select<'keepachangelog' | 'conventional'>({
    message: 'Changelog format:',
    choices: [
      { name: 'Conventional (auto-generated from commits)', value: 'conventional' },
      { name: 'Keep a Changelog (manual, semantic)', value: 'keepachangelog' },
    ],
    default: defaults?.changelogFormat ?? DEFAULT_STANDARDS_CONFIG.documentation.changelogFormat,
  });

  const inlineCommentPolicy = await select<'why-not-what' | 'minimal' | 'extensive'>({
    message: 'Inline comment policy:',
    choices: [
      { name: 'Why not What (explain reasoning)', value: 'why-not-what' },
      { name: 'Minimal (only when necessary)', value: 'minimal' },
      { name: 'Extensive (comment thoroughly)', value: 'extensive' },
    ],
    default:
      defaults?.inlineCommentPolicy ?? DEFAULT_STANDARDS_CONFIG.documentation.inlineCommentPolicy,
  });

  return {
    jsDocLevel,
    requireExamples,
    changelogFormat,
    inlineCommentPolicy,
  };
}

/**
 * Prompt for design standards
 */
async function promptDesignStandards(
  defaults?: Partial<StandardsConfigDesign>
): Promise<StandardsConfigDesign> {
  const def = STANDARDS_DEFINITIONS.design;
  logger.newline();
  logger.subtitle(`${def.icon} ${def.name}`);

  const cssFramework = await select<'tailwind' | 'css-modules' | 'styled-components' | 'vanilla'>({
    message: 'CSS framework:',
    choices: [
      { name: 'Tailwind CSS', value: 'tailwind' },
      { name: 'CSS Modules', value: 'css-modules' },
      { name: 'Styled Components', value: 'styled-components' },
      { name: 'Vanilla CSS', value: 'vanilla' },
    ],
    default: defaults?.cssFramework ?? DEFAULT_STANDARDS_CONFIG.design.cssFramework,
  });

  const componentLibrary = await select<'shadcn' | 'radix' | 'headless' | 'none'>({
    message: 'Component library:',
    choices: [
      { name: 'shadcn/ui', value: 'shadcn' },
      { name: 'Radix UI', value: 'radix' },
      { name: 'Headless UI', value: 'headless' },
      { name: 'None', value: 'none' },
    ],
    default: defaults?.componentLibrary ?? DEFAULT_STANDARDS_CONFIG.design.componentLibrary,
  });

  const accessibilityLevel = await select<'A' | 'AA' | 'AAA'>({
    message: 'WCAG accessibility level:',
    choices: [
      { name: 'Level A (minimum)', value: 'A' },
      { name: 'Level AA (recommended)', value: 'AA' },
      { name: 'Level AAA (highest)', value: 'AAA' },
    ],
    default: defaults?.accessibilityLevel ?? DEFAULT_STANDARDS_CONFIG.design.accessibilityLevel,
  });

  const darkModeSupport = await confirm({
    message: 'Support dark mode?',
    default: defaults?.darkModeSupport ?? DEFAULT_STANDARDS_CONFIG.design.darkModeSupport,
  });

  return {
    cssFramework,
    componentLibrary,
    accessibilityLevel,
    darkModeSupport,
  };
}

/**
 * Prompt for security standards
 */
async function promptSecurityStandards(
  defaults?: Partial<StandardsConfigSecurity>
): Promise<StandardsConfigSecurity> {
  const def = STANDARDS_DEFINITIONS.security;
  logger.newline();
  logger.subtitle(`${def.icon} ${def.name}`);

  const authPattern = await select<'jwt' | 'session' | 'oauth' | 'none'>({
    message: 'Authentication pattern:',
    choices: [
      { name: 'JWT (JSON Web Tokens)', value: 'jwt' },
      { name: 'Session (server-side)', value: 'session' },
      { name: 'OAuth 2.0 / OIDC', value: 'oauth' },
      { name: 'None', value: 'none' },
    ],
    default: defaults?.authPattern ?? DEFAULT_STANDARDS_CONFIG.security.authPattern,
  });

  const inputValidation = await select<'zod' | 'yup' | 'joi' | 'manual'>({
    message: 'Input validation library:',
    choices: [
      { name: 'Zod (TypeScript-first)', value: 'zod' },
      { name: 'Yup (schema builder)', value: 'yup' },
      { name: 'Joi (data validation)', value: 'joi' },
      { name: 'Manual (custom)', value: 'manual' },
    ],
    default: defaults?.inputValidation ?? DEFAULT_STANDARDS_CONFIG.security.inputValidation,
  });

  const csrfProtection = await confirm({
    message: 'Enable CSRF protection?',
    default: defaults?.csrfProtection ?? DEFAULT_STANDARDS_CONFIG.security.csrfProtection,
  });

  const rateLimiting = await confirm({
    message: 'Enable rate limiting?',
    default: defaults?.rateLimiting ?? DEFAULT_STANDARDS_CONFIG.security.rateLimiting,
  });

  return {
    authPattern,
    inputValidation,
    csrfProtection,
    rateLimiting,
  };
}

/**
 * Prompt for performance standards
 */
async function promptPerformanceStandards(
  defaults?: Partial<StandardsConfigPerformance>
): Promise<StandardsConfigPerformance> {
  const def = STANDARDS_DEFINITIONS.performance;
  logger.newline();
  logger.subtitle(`${def.icon} ${def.name}`);

  const lcpTarget = await select<number>({
    message: 'LCP target (Largest Contentful Paint):',
    choices: [
      { name: '1500ms (excellent)', value: 1500 },
      { name: '2000ms (good)', value: 2000 },
      { name: '2500ms (standard)', value: 2500 },
      { name: '4000ms (needs improvement)', value: 4000 },
    ],
    default: defaults?.lcpTarget ?? DEFAULT_STANDARDS_CONFIG.performance.lcpTarget,
  });

  const fidTarget = await select<number>({
    message: 'FID target (First Input Delay):',
    choices: [
      { name: '50ms (excellent)', value: 50 },
      { name: '100ms (good)', value: 100 },
      { name: '200ms (standard)', value: 200 },
      { name: '300ms (needs improvement)', value: 300 },
    ],
    default: defaults?.fidTarget ?? DEFAULT_STANDARDS_CONFIG.performance.fidTarget,
  });

  const clsTarget = await select<number>({
    message: 'CLS target (Cumulative Layout Shift):',
    choices: [
      { name: '0.05 (excellent)', value: 0.05 },
      { name: '0.1 (good)', value: 0.1 },
      { name: '0.15 (standard)', value: 0.15 },
      { name: '0.25 (needs improvement)', value: 0.25 },
    ],
    default: defaults?.clsTarget ?? DEFAULT_STANDARDS_CONFIG.performance.clsTarget,
  });

  const bundleSizeTargetKb = await select<number>({
    message: 'Bundle size target (KB):',
    choices: [
      { name: '100KB (strict)', value: 100 },
      { name: '150KB (good)', value: 150 },
      { name: '250KB (standard)', value: 250 },
      { name: '500KB (relaxed)', value: 500 },
    ],
    default:
      defaults?.bundleSizeTargetKb ?? DEFAULT_STANDARDS_CONFIG.performance.bundleSizeTargetKb,
  });

  const apiResponseTargetMs = await select<number>({
    message: 'API response time target (ms):',
    choices: [
      { name: '100ms (fast)', value: 100 },
      { name: '200ms (good)', value: 200 },
      { name: '300ms (standard)', value: 300 },
      { name: '500ms (relaxed)', value: 500 },
    ],
    default:
      defaults?.apiResponseTargetMs ?? DEFAULT_STANDARDS_CONFIG.performance.apiResponseTargetMs,
  });

  return {
    lcpTarget,
    fidTarget,
    clsTarget,
    bundleSizeTargetKb,
    apiResponseTargetMs,
  };
}

/**
 * Show standards configuration summary
 */
export function showStandardsSummary(config: StandardsConfig): void {
  logger.newline();
  logger.subtitle('Standards Summary');

  // Code standards
  logger.item(
    `Code: ${config.code.indentSize} ${config.code.indentStyle}s, ${config.code.quoteStyle} quotes`
  );
  logger.info(
    colors.muted(
      `  Max: ${config.code.maxLineLength} chars/line, ${config.code.maxFileLines} lines/file`
    )
  );
  logger.info(
    colors.muted(
      `  Rules: ${config.code.allowAny ? 'any allowed' : 'no any'}, ${config.code.namedExportsOnly ? 'named exports' : 'default exports'}`
    )
  );

  // Testing standards
  logger.item(
    `Testing: ${config.testing.coverageTarget}% coverage, ${config.testing.tddRequired ? 'TDD required' : 'TDD optional'}`
  );
  logger.info(
    colors.muted(
      `  Pattern: ${config.testing.testPattern.toUpperCase()}, Location: ${config.testing.testLocation}`
    )
  );

  // Documentation standards
  logger.item(`Documentation: ${config.documentation.jsDocLevel} JSDoc`);
  logger.info(colors.muted(`  Comments: ${config.documentation.inlineCommentPolicy}`));

  // Design standards
  logger.item(`Design: ${config.design.cssFramework}, ${config.design.componentLibrary}`);
  logger.info(
    colors.muted(
      `  A11y: WCAG ${config.design.accessibilityLevel}, ${config.design.darkModeSupport ? 'dark mode' : 'no dark mode'}`
    )
  );

  // Security standards
  logger.item(`Security: ${config.security.authPattern}, ${config.security.inputValidation}`);
  logger.info(
    colors.muted(
      `  ${config.security.csrfProtection ? 'CSRF' : 'no CSRF'}, ${config.security.rateLimiting ? 'rate limiting' : 'no rate limiting'}`
    )
  );

  // Performance standards
  logger.item(
    `Performance: LCP ${config.performance.lcpTarget}ms, FID ${config.performance.fidTarget}ms`
  );
  logger.info(
    colors.muted(
      `  Bundle: ${config.performance.bundleSizeTargetKb}KB, API: ${config.performance.apiResponseTargetMs}ms`
    )
  );
}

/**
 * Confirm standards configuration
 */
export async function confirmStandardsConfig(config: StandardsConfig): Promise<boolean> {
  showStandardsSummary(config);
  logger.newline();

  return confirm({
    message: 'Apply these standards?',
    default: true,
  });
}
