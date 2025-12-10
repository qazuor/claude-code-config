/**
 * Folder structure preferences prompts
 */

import {
  DOCS_LOCATION_OPTIONS,
  GITHUB_WORKFLOW_TEMPLATES,
  PLANNING_LOCATION_OPTIONS,
  TEST_LOCATION_OPTIONS,
  TEST_PATTERN_OPTIONS,
  getFolderRecommendationsForBundles,
  getRecommendedWorkflows,
  mergeFolderPreferences,
} from '../../constants/folder-preferences.js';
import { colors, logger } from '../../lib/utils/logger.js';
import { checkbox, confirm, select } from '../../lib/utils/prompt-cancel.js';
import type {
  DocsFileLocation,
  FolderPreferences,
  GithubWorkflowTemplate,
  PlanningFileLocation,
  TestFileLocation,
} from '../../types/folder-preferences.js';

/**
 * Prompt for test file location preference
 */
export async function promptTestLocation(options?: {
  recommended?: TestFileLocation;
}): Promise<{ location: TestFileLocation; pattern: string }> {
  const choices = TEST_LOCATION_OPTIONS.map((opt) => ({
    name: opt.name + (opt.value === options?.recommended ? ' ⭐' : ''),
    value: opt.value,
    description: opt.description,
  }));

  const location = await select<TestFileLocation>({
    message: 'Where should test files be located?',
    choices,
    default: options?.recommended || 'test-folder-root',
  });

  const patternChoices = TEST_PATTERN_OPTIONS.map((opt) => ({
    name: opt.name,
    value: opt.value,
    description: opt.description,
  }));

  const pattern = await select<string>({
    message: 'Test file naming pattern:',
    choices: patternChoices,
    default: '*.test.ts',
  });

  return { location, pattern };
}

/**
 * Prompt for planning file location preference
 */
export async function promptPlanningLocation(options?: {
  recommended?: PlanningFileLocation;
}): Promise<{ location: PlanningFileLocation; commitToGit: boolean }> {
  const choices = PLANNING_LOCATION_OPTIONS.map((opt) => ({
    name: opt.name + (opt.value === options?.recommended ? ' ⭐' : ''),
    value: opt.value,
    description: opt.description,
  }));

  const location = await select<PlanningFileLocation>({
    message: 'Where should planning files (PDR, tech-analysis, TODOs) be stored?',
    choices,
    default: options?.recommended || 'claude-sessions',
  });

  const commitToGit = await confirm({
    message: 'Should planning files be committed to git?',
    default: false,
  });

  if (!commitToGit) {
    logger.info(
      colors.muted('  Planning files will be added to .gitignore. You can change this later.')
    );
  }

  return { location, commitToGit };
}

/**
 * Prompt for documentation file location preference
 */
export async function promptDocsLocation(options?: {
  recommended?: DocsFileLocation;
}): Promise<{ location: DocsFileLocation }> {
  const choices = DOCS_LOCATION_OPTIONS.map((opt) => ({
    name: opt.name + (opt.value === options?.recommended ? ' ⭐' : ''),
    value: opt.value,
    description: opt.description,
  }));

  const location = await select<DocsFileLocation>({
    message: 'Where should documentation files be stored?',
    choices,
    default: options?.recommended || 'docs-root',
  });

  return { location };
}

/**
 * Prompt for GitHub Actions workflow selection
 */
export async function promptGithubWorkflows(options?: {
  recommended?: string[];
  technologies?: string[];
}): Promise<string[]> {
  // Get recommended workflows
  const recommendedWorkflows = options?.technologies
    ? getRecommendedWorkflows(options.technologies)
    : [];
  const recommendedIds = new Set([
    ...(options?.recommended || []),
    ...recommendedWorkflows.map((w) => w.id),
  ]);

  // Group by category
  const categories: Array<{ name: string; workflows: GithubWorkflowTemplate[] }> = [
    {
      name: 'CI (Continuous Integration)',
      workflows: GITHUB_WORKFLOW_TEMPLATES.filter((w) => w.category === 'ci'),
    },
    {
      name: 'Quality',
      workflows: GITHUB_WORKFLOW_TEMPLATES.filter((w) => w.category === 'quality'),
    },
    {
      name: 'Security',
      workflows: GITHUB_WORKFLOW_TEMPLATES.filter((w) => w.category === 'security'),
    },
    {
      name: 'CD (Deployment)',
      workflows: GITHUB_WORKFLOW_TEMPLATES.filter((w) => w.category === 'cd'),
    },
    {
      name: 'Release',
      workflows: GITHUB_WORKFLOW_TEMPLATES.filter((w) => w.category === 'release'),
    },
  ];

  logger.newline();
  logger.subtitle('GitHub Actions Workflows');
  logger.info('Select workflows to create. Use Space to toggle, Enter to confirm.');
  if (recommendedIds.size > 0) {
    logger.info(colors.muted('⭐ indicates recommended workflows for your stack.'));
  }
  logger.newline();

  const selectedWorkflows: string[] = [];

  for (const category of categories) {
    if (category.workflows.length === 0) continue;

    const choices = category.workflows.map((workflow) => ({
      name: workflow.name + (recommendedIds.has(workflow.id) ? ` ${colors.primary('⭐')}` : ''),
      value: workflow.id,
      description: workflow.description,
      checked: recommendedIds.has(workflow.id),
    }));

    const selected = await checkbox({
      message: `${category.name}:`,
      choices,
      required: false,
    });

    selectedWorkflows.push(...selected);
  }

  return selectedWorkflows;
}

/**
 * Prompt for folder preferences based on selected bundles
 */
export async function promptFolderPreferences(options: {
  selectedBundles: string[];
  technologies?: string[];
}): Promise<FolderPreferences> {
  const { selectedBundles, technologies = [] } = options;

  // Get recommendations based on bundles
  const recommendations = getFolderRecommendationsForBundles(selectedBundles);
  const mergedDefaults = mergeFolderPreferences(recommendations);

  // Determine which sections to show based on bundles
  const hasTestingBundle = selectedBundles.some(
    (id) => id.includes('testing') || id.includes('quality')
  );
  const hasPlanningBundle = selectedBundles.some((id) => id.includes('planning'));
  const hasDocsBundle = selectedBundles.some((id) => id.includes('documentation'));
  const hasCiCdBundle = selectedBundles.some((id) => id.includes('cicd') || id.includes('ci-cd'));

  // Show recommendations if any
  if (recommendations.length > 0) {
    logger.newline();
    logger.subtitle('Folder Structure Recommendations');
    logger.info(colors.muted('Based on your selected bundles, we recommend:'));
    for (const rec of recommendations) {
      logger.info(`  ${colors.primary('•')} ${rec.reason}`);
    }
    logger.newline();
  }

  const preferences: FolderPreferences = {};

  // Tests configuration
  if (hasTestingBundle) {
    logger.newline();
    logger.subtitle('Test Files Configuration');
    preferences.tests = await promptTestLocation({
      recommended: mergedDefaults.tests?.location,
    });
  }

  // Planning configuration
  if (hasPlanningBundle) {
    logger.newline();
    logger.subtitle('Planning Files Configuration');
    preferences.planning = await promptPlanningLocation({
      recommended: mergedDefaults.planning?.location,
    });
  }

  // Docs configuration
  if (hasDocsBundle) {
    logger.newline();
    logger.subtitle('Documentation Configuration');
    preferences.docs = await promptDocsLocation({
      recommended: mergedDefaults.docs?.location,
    });
  }

  // CI/CD configuration - ask if they want to set it up
  const setupCiCd =
    hasCiCdBundle ||
    (await confirm({
      message: 'Would you like to set up GitHub Actions workflows?',
      default: true,
    }));

  if (setupCiCd) {
    const workflows = await promptGithubWorkflows({
      recommended: mergedDefaults.cicd?.workflows,
      technologies,
    });

    if (workflows.length > 0) {
      preferences.cicd = {
        location: 'github-workflows',
        workflows,
      };
    }
  }

  return preferences;
}

/**
 * Show folder preferences summary
 */
export function showFolderPreferencesSummary(preferences: FolderPreferences): void {
  logger.newline();
  logger.subtitle('Folder Structure Summary');

  if (preferences.tests) {
    const testOpt = TEST_LOCATION_OPTIONS.find((o) => o.value === preferences.tests?.location);
    logger.keyValue('Tests', testOpt?.name || preferences.tests.location);
    logger.keyValue('Test Pattern', preferences.tests.pattern);
  }

  if (preferences.planning) {
    const planOpt = PLANNING_LOCATION_OPTIONS.find(
      (o) => o.value === preferences.planning?.location
    );
    logger.keyValue('Planning', planOpt?.name || preferences.planning.location);
    logger.keyValue(
      'Commit Planning',
      preferences.planning.commitToGit ? 'Yes' : 'No (will be in .gitignore)'
    );
  }

  if (preferences.docs) {
    const docsOpt = DOCS_LOCATION_OPTIONS.find((o) => o.value === preferences.docs?.location);
    logger.keyValue('Documentation', docsOpt?.name || preferences.docs.location);
  }

  if (preferences.cicd && preferences.cicd.workflows.length > 0) {
    logger.keyValue('CI/CD Location', '.github/workflows/');
    logger.info(`  ${colors.muted('Workflows:')} ${preferences.cicd.workflows.join(', ')}`);
  }
}

/**
 * Confirm folder preferences
 */
export async function confirmFolderPreferences(preferences: FolderPreferences): Promise<boolean> {
  showFolderPreferencesSummary(preferences);
  logger.newline();

  return confirm({
    message: 'Are these folder structure preferences correct?',
    default: true,
  });
}

/**
 * Quick folder preferences with smart defaults
 */
export async function promptQuickFolderPreferences(options: {
  selectedBundles: string[];
  technologies?: string[];
}): Promise<FolderPreferences | null> {
  const recommendations = getFolderRecommendationsForBundles(options.selectedBundles);
  const mergedDefaults = mergeFolderPreferences(recommendations);

  // If we have recommendations, show them and ask if user wants to customize
  if (recommendations.length > 0) {
    logger.section('Folder Structure', '📁');
    logger.info(colors.muted('Based on your bundles, we have recommended folder settings.'));

    showFolderPreferencesSummary(mergedDefaults);

    const customize = await confirm({
      message: 'Would you like to customize these folder preferences?',
      default: false,
    });

    if (!customize) {
      return mergedDefaults;
    }
  }

  // Full customization
  return promptFolderPreferences(options);
}
