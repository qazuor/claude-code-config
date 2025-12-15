/**
 * Default values for standards configurations
 */

import type {
  StandardsConfig,
  StandardsConfigCode,
  StandardsConfigDesign,
  StandardsConfigDocumentation,
  StandardsConfigPerformance,
  StandardsConfigSecurity,
  StandardsConfigTesting,
} from '../types/standards.js';

/**
 * Default code standards
 */
export const DEFAULT_CODE_STANDARDS: StandardsConfigCode = {
  indentStyle: 'space',
  indentSize: 2,
  maxLineLength: 100,
  maxFileLines: 500,
  quoteStyle: 'single',
  semicolons: true,
  trailingCommas: 'es5',
  allowAny: false,
  namedExportsOnly: true,
  roroPattern: true,
  jsDocRequired: true,
};

/**
 * Default testing standards
 */
export const DEFAULT_TESTING_STANDARDS: StandardsConfigTesting = {
  coverageTarget: 80,
  tddRequired: true,
  testPattern: 'aaa',
  testLocation: 'separate',
  unitTestMaxMs: 100,
  integrationTestMaxMs: 1000,
};

/**
 * Default documentation standards
 */
export const DEFAULT_DOCUMENTATION_STANDARDS: StandardsConfigDocumentation = {
  jsDocLevel: 'standard',
  requireExamples: false,
  changelogFormat: 'conventional',
  inlineCommentPolicy: 'why-not-what',
};

/**
 * Default design standards
 */
export const DEFAULT_DESIGN_STANDARDS: StandardsConfigDesign = {
  cssFramework: 'tailwind',
  componentLibrary: 'shadcn',
  accessibilityLevel: 'AA',
  darkModeSupport: true,
};

/**
 * Default security standards
 */
export const DEFAULT_SECURITY_STANDARDS: StandardsConfigSecurity = {
  authPattern: 'jwt',
  inputValidation: 'zod',
  csrfProtection: true,
  rateLimiting: true,
};

/**
 * Default performance standards
 */
export const DEFAULT_PERFORMANCE_STANDARDS: StandardsConfigPerformance = {
  lcpTarget: 2500,
  fidTarget: 100,
  clsTarget: 0.1,
  bundleSizeTargetKb: 250,
  apiResponseTargetMs: 300,
};

/**
 * Default complete standards configuration
 */
export const DEFAULT_STANDARDS_CONFIG: StandardsConfig = {
  code: DEFAULT_CODE_STANDARDS,
  testing: DEFAULT_TESTING_STANDARDS,
  documentation: DEFAULT_DOCUMENTATION_STANDARDS,
  design: DEFAULT_DESIGN_STANDARDS,
  security: DEFAULT_SECURITY_STANDARDS,
  performance: DEFAULT_PERFORMANCE_STANDARDS,
};

/**
 * Standards presets for quick selection
 */
export type StandardsPreset =
  | 'strict'
  | 'balanced'
  | 'relaxed'
  | 'startup'
  | 'enterprise'
  | 'custom';

export interface StandardsPresetConfig {
  name: string;
  description: string;
  config: StandardsConfig;
}

export const STANDARDS_PRESETS: Record<StandardsPreset, StandardsPresetConfig> = {
  strict: {
    name: 'Strict',
    description: 'High quality standards with strict enforcement (90%+ coverage, TDD required)',
    config: {
      code: {
        ...DEFAULT_CODE_STANDARDS,
        allowAny: false,
        jsDocRequired: true,
      },
      testing: {
        ...DEFAULT_TESTING_STANDARDS,
        coverageTarget: 90,
        tddRequired: true,
      },
      documentation: {
        ...DEFAULT_DOCUMENTATION_STANDARDS,
        jsDocLevel: 'comprehensive',
        requireExamples: true,
      },
      design: {
        ...DEFAULT_DESIGN_STANDARDS,
        accessibilityLevel: 'AAA',
      },
      security: {
        ...DEFAULT_SECURITY_STANDARDS,
        csrfProtection: true,
        rateLimiting: true,
      },
      performance: {
        ...DEFAULT_PERFORMANCE_STANDARDS,
        lcpTarget: 2000,
        apiResponseTargetMs: 200,
      },
    },
  },
  balanced: {
    name: 'Balanced',
    description: 'Good balance between quality and pragmatism (80% coverage)',
    config: DEFAULT_STANDARDS_CONFIG,
  },
  relaxed: {
    name: 'Relaxed',
    description: 'More flexible standards for rapid development (70% coverage)',
    config: {
      code: {
        ...DEFAULT_CODE_STANDARDS,
        maxFileLines: 800,
        jsDocRequired: false,
      },
      testing: {
        ...DEFAULT_TESTING_STANDARDS,
        coverageTarget: 70,
        tddRequired: false,
      },
      documentation: {
        ...DEFAULT_DOCUMENTATION_STANDARDS,
        jsDocLevel: 'minimal',
        requireExamples: false,
      },
      design: {
        ...DEFAULT_DESIGN_STANDARDS,
        accessibilityLevel: 'A',
      },
      security: {
        ...DEFAULT_SECURITY_STANDARDS,
      },
      performance: {
        ...DEFAULT_PERFORMANCE_STANDARDS,
        lcpTarget: 4000,
        apiResponseTargetMs: 500,
      },
    },
  },
  startup: {
    name: 'Startup',
    description: 'Fast iteration with minimum viable standards (60% coverage)',
    config: {
      code: {
        ...DEFAULT_CODE_STANDARDS,
        maxFileLines: 1000,
        jsDocRequired: false,
        roroPattern: false,
      },
      testing: {
        coverageTarget: 60,
        tddRequired: false,
        testPattern: 'aaa',
        testLocation: 'colocated',
        unitTestMaxMs: 200,
        integrationTestMaxMs: 2000,
      },
      documentation: {
        jsDocLevel: 'minimal',
        requireExamples: false,
        changelogFormat: 'conventional',
        inlineCommentPolicy: 'minimal',
      },
      design: {
        cssFramework: 'tailwind',
        componentLibrary: 'shadcn',
        accessibilityLevel: 'A',
        darkModeSupport: false,
      },
      security: {
        authPattern: 'jwt',
        inputValidation: 'zod',
        csrfProtection: false,
        rateLimiting: false,
      },
      performance: {
        lcpTarget: 4000,
        fidTarget: 300,
        clsTarget: 0.25,
        bundleSizeTargetKb: 500,
        apiResponseTargetMs: 500,
      },
    },
  },
  enterprise: {
    name: 'Enterprise',
    description: 'Enterprise-grade standards with full compliance (95%+ coverage)',
    config: {
      code: {
        indentStyle: 'space',
        indentSize: 2,
        maxLineLength: 120,
        maxFileLines: 400,
        quoteStyle: 'single',
        semicolons: true,
        trailingCommas: 'all',
        allowAny: false,
        namedExportsOnly: true,
        roroPattern: true,
        jsDocRequired: true,
      },
      testing: {
        coverageTarget: 95,
        tddRequired: true,
        testPattern: 'aaa',
        testLocation: 'separate',
        unitTestMaxMs: 50,
        integrationTestMaxMs: 500,
      },
      documentation: {
        jsDocLevel: 'comprehensive',
        requireExamples: true,
        changelogFormat: 'keepachangelog',
        inlineCommentPolicy: 'why-not-what',
      },
      design: {
        cssFramework: 'tailwind',
        componentLibrary: 'radix',
        accessibilityLevel: 'AAA',
        darkModeSupport: true,
      },
      security: {
        authPattern: 'oauth',
        inputValidation: 'zod',
        csrfProtection: true,
        rateLimiting: true,
      },
      performance: {
        lcpTarget: 1500,
        fidTarget: 50,
        clsTarget: 0.05,
        bundleSizeTargetKb: 150,
        apiResponseTargetMs: 150,
      },
    },
  },
  custom: {
    name: 'Custom',
    description: 'Configure each standard manually',
    config: DEFAULT_STANDARDS_CONFIG,
  },
};
