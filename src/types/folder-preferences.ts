/**
 * Folder structure preferences based on selected bundles
 */

/**
 * Test files location preference
 */
export type TestFileLocation =
  | 'colocated' // Tests next to source files (e.g., src/utils/foo.ts, src/utils/foo.test.ts)
  | 'test-folder-root' // Tests in root test/ folder mirroring src structure
  | 'test-folder-src'; // Tests in src/__tests__/ folder

/**
 * Planning files location preference
 */
export type PlanningFileLocation =
  | 'claude-sessions' // In .claude/sessions/planning/
  | 'docs-planning' // In docs/planning/
  | 'root-planning'; // In planning/ at project root

/**
 * Documentation files location preference
 */
export type DocsFileLocation =
  | 'docs-root' // In docs/ at project root
  | 'claude-docs' // In .claude/docs/
  | 'readme-only'; // Only README.md files, no separate docs folder

/**
 * CI/CD configuration location
 */
export type CiCdLocation =
  | 'github-workflows' // .github/workflows/
  | 'gitlab-ci' // .gitlab-ci.yml
  | 'custom'; // Custom location specified by user

/**
 * Available GitHub Actions workflow templates
 */
export interface GithubWorkflowTemplate {
  /** Template ID */
  id: string;
  /** Display name */
  name: string;
  /** Description */
  description: string;
  /** Filename */
  filename: string;
  /** Category */
  category: 'ci' | 'cd' | 'quality' | 'security' | 'release';
  /** Technologies this template is best suited for */
  suitedFor?: string[];
  /** Whether this is recommended for the selected bundles */
  recommended?: boolean;
}

/**
 * Folder structure preferences
 */
export interface FolderPreferences {
  /** Test files location */
  tests?: {
    location: TestFileLocation;
    /** Test file naming pattern (e.g., "*.test.ts", "*.spec.ts") */
    pattern: string;
  };

  /** Planning/sessions files location */
  planning?: {
    location: PlanningFileLocation;
    /** Whether to commit planning files to git */
    commitToGit: boolean;
  };

  /** Documentation files location */
  docs?: {
    location: DocsFileLocation;
  };

  /** CI/CD configuration */
  cicd?: {
    location: CiCdLocation;
    /** Selected workflow templates */
    workflows: string[];
  };
}

/**
 * Bundle-specific folder recommendations
 */
export interface BundleFolderRecommendations {
  /** Bundle ID or category that triggers these recommendations */
  trigger: string;
  /** Recommended folder preferences */
  recommendations: Partial<FolderPreferences>;
  /** Message explaining why these are recommended */
  reason: string;
}
