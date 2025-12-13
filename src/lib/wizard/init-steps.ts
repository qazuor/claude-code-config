/**
 * Init Wizard Step Definitions
 *
 * Wraps existing prompt functions as wizard steps with back navigation support.
 * Each step definition integrates with the existing prompts while adding
 * wizard-specific behavior (defaults from history, navigation handling).
 */

import type { SkippedMcpConfig } from '../../cli/prompts/mcp-config.js';
import type { BundleSelectionResult } from '../../types/bundles.js';
import type {
  CodeStyleConfig,
  HookConfig,
  McpConfig,
  Preferences,
  ProjectInfo,
} from '../../types/config.js';
import type { FolderPreferences } from '../../types/folder-preferences.js';
import type { PermissionsConfig } from '../../types/permissions.js';
import type { PackageManager, ScaffoldOptions } from '../../types/scaffold.js';
import type { TemplateConfig } from '../../types/template-config.js';
import type { CICDConfig } from '../ci-cd/index.js';
import type { WizardConfig, WizardStepConfig } from './engine.js';
import type { StepExecutionResult, WizardStepDefinition } from './step.js';

import {
  promptBundleMode,
  promptQuickBundleSelection,
  showBundlesSummary,
} from '../../cli/prompts/bundle-select.js';
import { promptCICDConfig } from '../../cli/prompts/ci-cd-config.js';
import { promptCodeStyleConfig } from '../../cli/prompts/code-style.js';
import { promptQuickFolderPreferences } from '../../cli/prompts/folder-preferences.js';
import { promptHookConfig } from '../../cli/prompts/hook-config.js';
import { selectItemsFromCategory } from '../../cli/prompts/item-select.js';
import { promptMcpConfig } from '../../cli/prompts/mcp-config.js';
import { promptPermissionsConfig } from '../../cli/prompts/permissions.js';
import { promptPreferences } from '../../cli/prompts/preferences.js';
import { confirmProjectInfo, promptProjectInfo } from '../../cli/prompts/project-info.js';
import { promptScaffoldOptions } from '../../cli/prompts/scaffold.js';
import { buildConfigContext, promptTemplateConfig } from '../../cli/prompts/template-config.js';
import type { ModuleCategory, ModuleRegistry } from '../../types/modules.js';
import { resolveBundles } from '../bundles/resolver.js';
import { colors, logger } from '../utils/logger.js';
import { select } from '../utils/prompt-cancel.js';
import { BACK_OPTION_VALUE, type BackOptionValue } from './navigator.js';

/**
 * All values collected during the init wizard
 */
export interface InitWizardValues {
  projectInfo: ProjectInfo;
  preferences: Preferences;
  scaffoldOptions: ScaffoldOptions;
  bundleSelection: BundleSelectionResult;
  hookConfig: HookConfig;
  mcpConfig: { config: McpConfig; skippedConfigs: SkippedMcpConfig[] };
  permissionsConfig: PermissionsConfig;
  codeStyleConfig: CodeStyleConfig;
  cicdConfig: CICDConfig;
  folderPreferences: FolderPreferences | null;
  templateConfig: Partial<TemplateConfig>;
  /** Index signature to satisfy Record<string, unknown> constraint */
  [key: string]: unknown;
}

/**
 * Context available to init wizard steps
 */
export interface InitWizardContext extends Partial<InitWizardValues> {
  projectPath: string;
  registry?: ModuleRegistry;
  detection: {
    detected: boolean;
    projectType?: string;
    packageManager?: PackageManager;
    suggestedBundles?: string[];
    detectedTechnologies?: string[];
  };
}

/**
 * Helper to create a step result with navigation
 */
function createResult<T>(
  value: T,
  navigation: 'next' | 'back' | 'cancel' = 'next'
): StepExecutionResult<T> {
  return {
    value,
    navigation,
    wasModified: true,
  };
}

/**
 * Prompt for back option at start of a step (for steps using input prompts)
 * Returns true if user wants to go back
 */
async function promptBackOption(stepIndex: number, stepName: string): Promise<boolean> {
  if (stepIndex === 0) {
    return false; // First step, no back option
  }

  const result = await select<'continue' | BackOptionValue>({
    message: `${stepName}`,
    choices: [
      {
        name: `${colors.muted('←')} Back to previous step`,
        value: BACK_OPTION_VALUE,
        description: 'Return to the previous step',
      },
      {
        name: 'Continue with this step',
        value: 'continue' as const,
        description: 'Proceed to configure this section',
      },
    ],
    default: 'continue',
  });

  return result === BACK_OPTION_VALUE;
}

// ============================================================================
// Step Definitions
// ============================================================================

/**
 * Step 1: Project Information
 */
function createProjectInfoStep(): WizardStepDefinition<ProjectInfo, InitWizardContext> {
  return {
    metadata: {
      id: 'projectInfo',
      name: 'Project Information',
      description: 'Basic project identification and metadata',
      required: true,
    },
    computeDefaults: (ctx) => ctx.projectInfo,
    execute: async (_ctx, defaults) => {
      // First step has no back option
      const value = await promptProjectInfo({ defaults });

      // Use existing confirmation flow
      const confirmed = await confirmProjectInfo(value);
      if (!confirmed) {
        // User wants to re-enter - execute again with current values as defaults
        return createResult(value, 'back');
      }

      return createResult(value, 'next');
    },
  };
}

/**
 * Step 2: Preferences
 */
function createPreferencesStep(): WizardStepDefinition<Preferences, InitWizardContext> {
  return {
    metadata: {
      id: 'preferences',
      name: 'Preferences',
      description: 'Language and package manager settings',
      required: true,
    },
    computeDefaults: (ctx) => ctx.preferences,
    execute: async (ctx, defaults) => {
      // Check if user wants to go back
      const goBack = await promptBackOption(1, 'Configure preferences or go back?');
      if (goBack) {
        return createResult(defaults as Preferences, 'back');
      }

      const value = await promptPreferences({
        detectedPackageManager: ctx.detection.packageManager,
        defaults,
      });

      return createResult(value, 'next');
    },
  };
}

/**
 * Step 3: Scaffold Options
 */
function createScaffoldStep(): WizardStepDefinition<ScaffoldOptions, InitWizardContext> {
  return {
    metadata: {
      id: 'scaffoldOptions',
      name: 'Scaffold Options',
      description: 'Project structure and scaffolding type',
      required: true,
    },
    computeDefaults: (ctx) => ctx.scaffoldOptions,
    execute: async (ctx, defaults) => {
      const goBack = await promptBackOption(2, 'Configure scaffold or go back?');
      if (goBack) {
        return createResult(defaults as ScaffoldOptions, 'back');
      }

      const value = await promptScaffoldOptions({
        existingProject: ctx.detection.detected,
        detectedType: ctx.detection.projectType as ScaffoldOptions['projectType'],
        detectedPackageManager: ctx.detection.packageManager,
      });

      return createResult(value, 'next');
    },
  };
}

/**
 * Step 4: Bundle Selection
 */
function createBundleSelectionStep(): WizardStepDefinition<
  BundleSelectionResult,
  InitWizardContext
> {
  return {
    metadata: {
      id: 'bundleSelection',
      name: 'Module Bundles',
      description: 'Select pre-configured module bundles',
      required: true,
    },
    computeDefaults: (ctx) => ctx.bundleSelection,
    execute: async (ctx, defaults) => {
      const goBack = await promptBackOption(3, 'Select bundles or go back?');
      if (goBack) {
        return createResult(defaults as BundleSelectionResult, 'back');
      }

      // Show suggested bundles if available
      if (ctx.detection.suggestedBundles?.length) {
        logger.info(
          colors.muted(
            `Suggested bundles based on your project: ${ctx.detection.suggestedBundles.join(', ')}`
          )
        );
      }

      // Ask selection mode
      const mode = await promptBundleMode();

      const result: BundleSelectionResult = {
        selectedBundles: defaults?.selectedBundles || [],
        additionalModules: defaults?.additionalModules || {
          agents: [],
          skills: [],
          commands: [],
          docs: [],
        },
      };

      if (mode === 'bundles' || mode === 'both') {
        result.selectedBundles = await promptQuickBundleSelection();

        if (result.selectedBundles.length > 0) {
          showBundlesSummary(result.selectedBundles);
        }
      }

      if (mode === 'individual' || mode === 'both') {
        // Get preselected from bundles
        const preselectedFromBundles = resolveBundles(result.selectedBundles);
        const categories: ModuleCategory[] = ['agents', 'skills', 'commands', 'docs'];

        if (ctx.registry) {
          logger.newline();
          logger.subtitle('Individual Module Selection');

          for (const category of categories) {
            const preselected =
              mode === 'both'
                ? preselectedFromBundles[category as keyof typeof preselectedFromBundles]
                : [];

            const categoryResult = await selectItemsFromCategory(category, ctx.registry[category], {
              preselected,
              showDescriptions: true,
            });

            // Store additional modules (not from bundles)
            if (mode === 'both') {
              result.additionalModules[category] = categoryResult.selectedItems.filter(
                (id) => !preselected.includes(id)
              );
            } else {
              result.additionalModules[category] = categoryResult.selectedItems;
            }
          }
        }
      }

      return createResult(result, 'next');
    },
  };
}

/**
 * Step 5: Hook Configuration
 */
function createHookConfigStep(): WizardStepDefinition<HookConfig, InitWizardContext> {
  return {
    metadata: {
      id: 'hookConfig',
      name: 'Notification Hooks',
      description: 'Configure notification and sound hooks',
      required: false,
    },
    computeDefaults: (ctx) => {
      if (ctx.hookConfig) return ctx.hookConfig;
      // Default based on bundle selection
      const hasTesting = ctx.bundleSelection?.selectedBundles.some((id) => id.includes('testing'));
      return hasTesting ? { enabled: true } : { enabled: false };
    },
    execute: async (_ctx, defaults) => {
      const goBack = await promptBackOption(4, 'Configure hooks or go back?');
      if (goBack) {
        return createResult(defaults as HookConfig, 'back');
      }

      const value = await promptHookConfig({ defaults });
      return createResult(value, 'next');
    },
  };
}

/**
 * Step 6: MCP Configuration
 */
function createMcpConfigStep(): WizardStepDefinition<
  { config: McpConfig; skippedConfigs: SkippedMcpConfig[] },
  InitWizardContext
> {
  return {
    metadata: {
      id: 'mcpConfig',
      name: 'MCP Servers',
      description: 'Configure Model Context Protocol servers',
      required: false,
    },
    computeDefaults: (ctx) => ctx.mcpConfig,
    execute: async (ctx, defaults) => {
      const goBack = await promptBackOption(5, 'Configure MCP servers or go back?');
      if (goBack) {
        return createResult(
          defaults as { config: McpConfig; skippedConfigs: SkippedMcpConfig[] },
          'back'
        );
      }

      const result = await promptMcpConfig({ projectPath: ctx.projectPath });
      return createResult(result, 'next');
    },
  };
}

/**
 * Step 7: Permissions Configuration
 */
function createPermissionsStep(): WizardStepDefinition<PermissionsConfig, InitWizardContext> {
  return {
    metadata: {
      id: 'permissionsConfig',
      name: 'Permissions',
      description: 'Configure file, git, and bash permissions',
      required: true,
    },
    computeDefaults: (ctx) => ctx.permissionsConfig,
    execute: async (_ctx, defaults) => {
      const goBack = await promptBackOption(6, 'Configure permissions or go back?');
      if (goBack) {
        return createResult(defaults as PermissionsConfig, 'back');
      }

      const value = await promptPermissionsConfig();
      return createResult(value, 'next');
    },
  };
}

/**
 * Step 8: Code Style Configuration
 */
function createCodeStyleStep(): WizardStepDefinition<CodeStyleConfig, InitWizardContext> {
  return {
    metadata: {
      id: 'codeStyleConfig',
      name: 'Code Style',
      description: 'Configure EditorConfig, Biome, Prettier, Commitlint',
      required: false,
    },
    computeDefaults: (ctx) => ctx.codeStyleConfig,
    execute: async (_ctx, defaults) => {
      const goBack = await promptBackOption(7, 'Configure code style or go back?');
      if (goBack) {
        return createResult(defaults as CodeStyleConfig, 'back');
      }

      const value = await promptCodeStyleConfig({ defaults });
      return createResult(value, 'next');
    },
  };
}

/**
 * Step 9: CI/CD Configuration
 */
function createCICDStep(): WizardStepDefinition<CICDConfig, InitWizardContext> {
  return {
    metadata: {
      id: 'cicdConfig',
      name: 'CI/CD',
      description: 'Configure GitHub Actions workflows',
      required: false,
    },
    computeDefaults: (ctx) => ctx.cicdConfig,
    execute: async (ctx, defaults) => {
      const goBack = await promptBackOption(8, 'Configure CI/CD or go back?');
      if (goBack) {
        return createResult(defaults as CICDConfig, 'back');
      }

      const value = await promptCICDConfig({
        packageManager: ctx.preferences?.packageManager,
        defaults,
      });
      return createResult(value, 'next');
    },
  };
}

/**
 * Step 10: Folder Preferences
 */
function createFolderPreferencesStep(): WizardStepDefinition<
  FolderPreferences | null,
  InitWizardContext
> {
  return {
    metadata: {
      id: 'folderPreferences',
      name: 'Folder Structure',
      description: 'Configure test, planning, and documentation locations',
      required: false,
      dependsOn: ['bundleSelection'],
    },
    computeDefaults: (ctx) => ctx.folderPreferences ?? null,
    execute: async (ctx, defaults) => {
      const goBack = await promptBackOption(9, 'Configure folder preferences or go back?');
      if (goBack) {
        return createResult(defaults ?? null, 'back');
      }

      const value = await promptQuickFolderPreferences({
        selectedBundles: ctx.bundleSelection?.selectedBundles || [],
        technologies: ctx.detection.detectedTechnologies || [],
      });
      return createResult(value, 'next');
    },
  };
}

/**
 * Step 11: Template Configuration
 */
function createTemplateConfigStep(): WizardStepDefinition<
  Partial<TemplateConfig>,
  InitWizardContext
> {
  return {
    metadata: {
      id: 'templateConfig',
      name: 'Template Placeholders',
      description: 'Configure template placeholder values',
      required: false,
    },
    computeDefaults: (ctx) => ctx.templateConfig ?? {},
    execute: async (ctx, defaults) => {
      const goBack = await promptBackOption(10, 'Configure templates or go back?');
      if (goBack) {
        return createResult(defaults ?? {}, 'back');
      }

      logger.newline();
      const configContext = await buildConfigContext(ctx.projectPath);
      const value = await promptTemplateConfig({
        context: configContext,
        mode: 'quick',
      });
      return createResult(value ?? {}, 'next');
    },
  };
}

// ============================================================================
// Wizard Configuration Builder
// ============================================================================

/**
 * Create the complete init wizard configuration
 */
export function createInitWizardConfig(
  projectPath: string,
  detection: InitWizardContext['detection'],
  registry?: ModuleRegistry
): WizardConfig<InitWizardContext> {
  // Note: projectPath, detection, and registry are passed to runWizard as initialContext
  // These parameters are kept for reference but not used directly here
  void projectPath;
  void detection;
  void registry;

  // Cast step definitions to the expected type
  const steps: WizardStepConfig<InitWizardContext>[] = [
    {
      id: 'projectInfo',
      definition: createProjectInfoStep() as WizardStepDefinition<unknown, InitWizardContext>,
    },
    {
      id: 'preferences',
      definition: createPreferencesStep() as WizardStepDefinition<unknown, InitWizardContext>,
    },
    {
      id: 'scaffoldOptions',
      definition: createScaffoldStep() as WizardStepDefinition<unknown, InitWizardContext>,
    },
    {
      id: 'bundleSelection',
      definition: createBundleSelectionStep() as WizardStepDefinition<unknown, InitWizardContext>,
    },
    {
      id: 'hookConfig',
      definition: createHookConfigStep() as WizardStepDefinition<unknown, InitWizardContext>,
    },
    {
      id: 'mcpConfig',
      definition: createMcpConfigStep() as WizardStepDefinition<unknown, InitWizardContext>,
    },
    {
      id: 'permissionsConfig',
      definition: createPermissionsStep() as WizardStepDefinition<unknown, InitWizardContext>,
    },
    {
      id: 'codeStyleConfig',
      definition: createCodeStyleStep() as WizardStepDefinition<unknown, InitWizardContext>,
    },
    {
      id: 'cicdConfig',
      definition: createCICDStep() as WizardStepDefinition<unknown, InitWizardContext>,
    },
    {
      id: 'folderPreferences',
      definition: createFolderPreferencesStep() as WizardStepDefinition<unknown, InitWizardContext>,
    },
    {
      id: 'templateConfig',
      definition: createTemplateConfigStep() as WizardStepDefinition<unknown, InitWizardContext>,
    },
  ];

  return {
    id: 'init-wizard',
    title: 'Claude Code Configuration',
    allowSkip: true,
    showProgress: true,
    steps,
  };
}
