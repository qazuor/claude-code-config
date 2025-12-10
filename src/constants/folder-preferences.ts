/**
 * Folder preferences constants and defaults
 */

import type {
  BundleFolderRecommendations,
  FolderPreferences,
  GithubWorkflowTemplate,
} from '../types/folder-preferences.js';

/**
 * Default folder preferences
 */
export const DEFAULT_FOLDER_PREFERENCES: FolderPreferences = {
  tests: {
    location: 'test-folder-root',
    pattern: '*.test.ts',
  },
  planning: {
    location: 'claude-sessions',
    commitToGit: false,
  },
  docs: {
    location: 'docs-root',
  },
  cicd: {
    location: 'github-workflows',
    workflows: [],
  },
};

/**
 * Test file location options with descriptions
 */
export const TEST_LOCATION_OPTIONS = [
  {
    value: 'colocated' as const,
    name: 'Colocated with source files',
    description:
      'Tests next to source files (e.g., src/utils/foo.ts → src/utils/foo.test.ts). Good for small projects.',
  },
  {
    value: 'test-folder-root' as const,
    name: 'Root test/ folder (Recommended)',
    description:
      'Tests in test/ folder mirroring src structure (e.g., test/utils/foo.test.ts). Best for medium-large projects.',
  },
  {
    value: 'test-folder-src' as const,
    name: 'Inside src/__tests__/',
    description:
      'Tests in src/__tests__/ folder (e.g., src/__tests__/utils/foo.test.ts). Common in Create React App.',
  },
];

/**
 * Planning file location options
 */
export const PLANNING_LOCATION_OPTIONS = [
  {
    value: 'claude-sessions' as const,
    name: '.claude/sessions/planning/ (Recommended)',
    description:
      'Planning files in .claude/sessions/planning/. Keeps Claude-specific files organized.',
  },
  {
    value: 'docs-planning' as const,
    name: 'docs/planning/',
    description:
      'Planning files in docs/planning/. Good if you want planning docs alongside other docs.',
  },
  {
    value: 'root-planning' as const,
    name: 'planning/ at root',
    description: 'Planning files in planning/ at project root. Maximum visibility.',
  },
];

/**
 * Documentation file location options
 */
export const DOCS_LOCATION_OPTIONS = [
  {
    value: 'docs-root' as const,
    name: 'docs/ at project root (Recommended)',
    description: 'Documentation in docs/ folder. Standard location for most projects.',
  },
  {
    value: 'claude-docs' as const,
    name: '.claude/docs/',
    description: 'Documentation in .claude/docs/. Keeps all Claude-related files together.',
  },
  {
    value: 'readme-only' as const,
    name: 'README files only',
    description: 'Only README.md files, no separate docs folder. Good for simple projects.',
  },
];

/**
 * Test file naming pattern options
 */
export const TEST_PATTERN_OPTIONS = [
  {
    value: '*.test.ts',
    name: '*.test.ts (Recommended)',
    description: 'Standard test pattern (foo.test.ts)',
  },
  {
    value: '*.spec.ts',
    name: '*.spec.ts',
    description: 'Spec pattern common in Angular (foo.spec.ts)',
  },
  {
    value: '*.test.tsx',
    name: '*.test.tsx',
    description: 'For React component tests (Component.test.tsx)',
  },
];

/**
 * GitHub Actions workflow templates
 */
export const GITHUB_WORKFLOW_TEMPLATES: GithubWorkflowTemplate[] = [
  // CI Workflows
  {
    id: 'ci-node',
    name: 'Node.js CI',
    description: 'Run tests, lint, and type-check on push and PR',
    filename: 'ci.yml',
    category: 'ci',
    suitedFor: ['node', 'typescript', 'javascript'],
    recommended: true,
  },
  {
    id: 'ci-node-matrix',
    name: 'Node.js CI (Matrix)',
    description: 'Test across multiple Node.js versions (18, 20, 22)',
    filename: 'ci-matrix.yml',
    category: 'ci',
    suitedFor: ['node', 'typescript', 'library'],
  },
  {
    id: 'ci-pnpm',
    name: 'PNPM CI',
    description: 'CI workflow optimized for PNPM with caching',
    filename: 'ci-pnpm.yml',
    category: 'ci',
    suitedFor: ['pnpm', 'monorepo'],
    recommended: true,
  },
  {
    id: 'ci-turborepo',
    name: 'Turborepo CI',
    description: 'CI for Turborepo monorepos with remote caching',
    filename: 'ci-turborepo.yml',
    category: 'ci',
    suitedFor: ['turborepo', 'monorepo'],
  },

  // Quality Workflows
  {
    id: 'quality-biome',
    name: 'Biome Quality Check',
    description: 'Run Biome linter and formatter checks',
    filename: 'quality-biome.yml',
    category: 'quality',
    suitedFor: ['biome', 'typescript'],
  },
  {
    id: 'quality-eslint-prettier',
    name: 'ESLint + Prettier',
    description: 'Run ESLint and Prettier checks',
    filename: 'quality-eslint.yml',
    category: 'quality',
    suitedFor: ['eslint', 'prettier'],
  },
  {
    id: 'quality-typecheck',
    name: 'TypeScript Type Check',
    description: 'Run TypeScript type checking only',
    filename: 'typecheck.yml',
    category: 'quality',
    suitedFor: ['typescript'],
  },

  // Security Workflows
  {
    id: 'security-codeql',
    name: 'CodeQL Analysis',
    description: 'GitHub CodeQL security scanning',
    filename: 'codeql.yml',
    category: 'security',
    suitedFor: ['javascript', 'typescript'],
  },
  {
    id: 'security-dependency-review',
    name: 'Dependency Review',
    description: 'Review dependencies for vulnerabilities on PRs',
    filename: 'dependency-review.yml',
    category: 'security',
  },
  {
    id: 'security-audit',
    name: 'NPM Audit',
    description: 'Run npm audit for security vulnerabilities',
    filename: 'npm-audit.yml',
    category: 'security',
    suitedFor: ['node', 'npm'],
  },

  // CD Workflows
  {
    id: 'cd-vercel',
    name: 'Vercel Deploy',
    description: 'Deploy to Vercel on push to main',
    filename: 'deploy-vercel.yml',
    category: 'cd',
    suitedFor: ['nextjs', 'react', 'vercel'],
  },
  {
    id: 'cd-cloudflare-pages',
    name: 'Cloudflare Pages Deploy',
    description: 'Deploy to Cloudflare Pages',
    filename: 'deploy-cloudflare.yml',
    category: 'cd',
    suitedFor: ['astro', 'cloudflare'],
  },
  {
    id: 'cd-docker',
    name: 'Docker Build & Push',
    description: 'Build and push Docker image to registry',
    filename: 'docker-build.yml',
    category: 'cd',
    suitedFor: ['docker', 'api'],
  },

  // Release Workflows
  {
    id: 'release-npm',
    name: 'NPM Publish',
    description: 'Publish package to NPM on release',
    filename: 'npm-publish.yml',
    category: 'release',
    suitedFor: ['library', 'npm'],
  },
  {
    id: 'release-changesets',
    name: 'Changesets Release',
    description: 'Automated versioning with Changesets',
    filename: 'changesets.yml',
    category: 'release',
    suitedFor: ['monorepo', 'library'],
  },
  {
    id: 'release-semantic',
    name: 'Semantic Release',
    description: 'Automated semantic versioning and changelog',
    filename: 'semantic-release.yml',
    category: 'release',
    suitedFor: ['library'],
  },
];

/**
 * Bundle-specific folder recommendations
 */
export const BUNDLE_FOLDER_RECOMMENDATIONS: BundleFolderRecommendations[] = [
  // Testing bundles
  {
    trigger: 'testing-complete',
    recommendations: {
      tests: {
        location: 'test-folder-root',
        pattern: '*.test.ts',
      },
    },
    reason:
      'Complete testing suite works best with a dedicated test/ folder to organize unit, integration, and E2E tests separately.',
  },
  {
    trigger: 'testing-minimal',
    recommendations: {
      tests: {
        location: 'colocated',
        pattern: '*.test.ts',
      },
    },
    reason:
      'Minimal testing with colocated tests keeps test files close to source for simpler projects.',
  },

  // Planning bundles
  {
    trigger: 'planning-complete',
    recommendations: {
      planning: {
        location: 'claude-sessions',
        commitToGit: false,
      },
    },
    reason:
      'Complete planning workflow uses .claude/sessions/planning/ to keep PDRs, tech-analysis, and TODOs organized.',
  },

  // Documentation bundles
  {
    trigger: 'documentation-complete',
    recommendations: {
      docs: {
        location: 'docs-root',
      },
    },
    reason:
      'Documentation bundle uses standard docs/ folder for maximum compatibility with documentation tools.',
  },

  // Stack-specific recommendations
  {
    trigger: 'react-tanstack-stack',
    recommendations: {
      tests: {
        location: 'test-folder-root',
        pattern: '*.test.tsx',
      },
    },
    reason: 'React projects benefit from *.test.tsx pattern for component tests with JSX support.',
  },
  {
    trigger: 'nextjs-prisma-stack',
    recommendations: {
      tests: {
        location: 'test-folder-root',
        pattern: '*.test.ts',
      },
      cicd: {
        location: 'github-workflows',
        workflows: ['ci-node', 'cd-vercel'],
      },
    },
    reason: 'Next.js projects typically deploy to Vercel with standard Node.js CI.',
  },
  {
    trigger: 'hono-drizzle-stack',
    recommendations: {
      tests: {
        location: 'test-folder-root',
        pattern: '*.test.ts',
      },
      cicd: {
        location: 'github-workflows',
        workflows: ['ci-pnpm', 'security-audit'],
      },
    },
    reason: 'API stacks benefit from security audits and optimized PNPM CI.',
  },
];

/**
 * Get workflow templates by category
 */
export function getWorkflowsByCategory(
  category: GithubWorkflowTemplate['category']
): GithubWorkflowTemplate[] {
  return GITHUB_WORKFLOW_TEMPLATES.filter((w) => w.category === category);
}

/**
 * Get recommended workflows based on detected technologies
 */
export function getRecommendedWorkflows(technologies: string[]): GithubWorkflowTemplate[] {
  const techSet = new Set(technologies.map((t) => t.toLowerCase()));

  return GITHUB_WORKFLOW_TEMPLATES.filter((workflow) => {
    if (workflow.recommended) return true;
    if (!workflow.suitedFor) return false;
    return workflow.suitedFor.some((tech) => techSet.has(tech.toLowerCase()));
  });
}

/**
 * Get folder recommendations for selected bundles
 */
export function getFolderRecommendationsForBundles(
  bundleIds: string[]
): BundleFolderRecommendations[] {
  const bundleSet = new Set(bundleIds);
  return BUNDLE_FOLDER_RECOMMENDATIONS.filter((rec) => bundleSet.has(rec.trigger));
}

/**
 * Merge folder recommendations with defaults
 */
export function mergeFolderPreferences(
  recommendations: BundleFolderRecommendations[]
): FolderPreferences {
  const merged = { ...DEFAULT_FOLDER_PREFERENCES };

  for (const rec of recommendations) {
    if (rec.recommendations.tests) {
      merged.tests = { ...merged.tests, ...rec.recommendations.tests };
    }
    if (rec.recommendations.planning) {
      merged.planning = { ...merged.planning, ...rec.recommendations.planning };
    }
    if (rec.recommendations.docs) {
      merged.docs = { ...merged.docs, ...rec.recommendations.docs };
    }
    if (rec.recommendations.cicd) {
      merged.cicd = {
        ...merged.cicd,
        ...rec.recommendations.cicd,
        // Merge workflows without duplicates
        workflows: [
          ...new Set([
            ...(merged.cicd?.workflows || []),
            ...(rec.recommendations.cicd.workflows || []),
          ]),
        ],
      };
    }
  }

  return merged;
}
