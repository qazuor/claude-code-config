/**
 * Init command - initialize Claude configuration
 */

import { Command } from 'commander';
import { resolveBundles } from '../../lib/bundles/resolver.js';
import { installCodeStyle, showCodeStyleInstructions } from '../../lib/code-style/index.js';
import { writeConfig } from '../../lib/config/index.js';
import {
  checkFeatureDependencies,
  formatDependencyReport,
  getRequiredFeatures,
} from '../../lib/dependencies/index.js';
import { installHooks } from '../../lib/hooks/index.js';
import { installMcpServers } from '../../lib/mcp/index.js';
import { filterModules, loadRegistry } from '../../lib/modules/index.js';
import { installAllModules, installExtras } from '../../lib/modules/installer.js';
import { installPermissions, setCoAuthorSetting } from '../../lib/permissions/index.js';
import { replacePlaceholders, showReplacementReport } from '../../lib/placeholders/index.js';
import {
  detectProject,
  generateScaffoldWithProgress,
  getProjectDescription,
  getProjectName,
  hasExistingClaudeConfig,
} from '../../lib/scaffold/index.js';
import { replaceTemplateConfigWithSpinner } from '../../lib/templates/config-replacer.js';
import { joinPath, resolvePath } from '../../lib/utils/fs.js';
import { colors, logger } from '../../lib/utils/logger.js';
import { getTemplatesPath } from '../../lib/utils/paths.js';
import {
  disableEscListener,
  enableEscListener,
  showCancelHint,
} from '../../lib/utils/prompt-cancel.js';
import { spinner, withSpinner } from '../../lib/utils/spinner.js';
import type { BundleSelectionResult } from '../../types/bundles.js';
import type { ClaudeConfig } from '../../types/config.js';
import type { ModuleCategory, ModuleDefinition, ModuleRegistry } from '../../types/modules.js';
import type { TemplateConfig } from '../../types/template-config.js';
import {
  promptBundleMode,
  promptQuickBundleSelection,
  showBundlesSummary,
} from '../prompts/bundle-select.js';
import {
  type SkippedMcpConfig,
  confirmFinalConfiguration,
  confirmProjectInfo,
  promptCodeStyleConfig,
  promptExistingProjectAction,
  promptHookConfig,
  promptMcpConfig,
  promptPermissionsConfig,
  promptPreferences,
  promptProjectInfo,
  promptScaffoldOptions,
  selectItemsFromCategory,
  showPostInstallInstructions,
  showSkippedMcpInstructions,
} from '../prompts/index.js';
import {
  buildConfigContext,
  promptSaveGlobalDefaults,
  promptTemplateConfig,
} from '../prompts/template-config.js';

/** Extended config result that includes skipped MCP configurations */
interface ConfigBuildResult {
  config: ClaudeConfig;
  skippedMcpConfigs: SkippedMcpConfig[];
  templateConfig?: Partial<TemplateConfig>;
}

// Package version (will be replaced at build time or read from package.json)
const VERSION = '0.1.0';

interface InitOptions {
  bundles?: string;
  template?: string;
  branch?: string;
  yes?: boolean;
  force?: boolean;
  dryRun?: boolean;
  claudeOnly?: boolean;
  noPlaceholders?: boolean;
  noMcp?: boolean;
  verbose?: boolean;
}

/**
 * Create init command
 */
export function createInitCommand(): Command {
  const cmd = new Command('init')
    .description('Initialize Claude configuration in a project')
    .argument('[path]', 'Project path (default: current directory)')
    .option(
      '-b, --bundles <ids>',
      'Comma-separated bundle IDs to install (e.g., "react-tanstack-stack,testing-complete")'
    )
    .option('-t, --template <url>', 'Remote git repo for templates')
    .option('--branch <name>', 'Branch/tag for remote template')
    .option('-y, --yes', 'Accept defaults, skip prompts')
    .option('-f, --force', 'Overwrite existing .claude/')
    .option('--dry-run', 'Show what would happen without making changes')
    .option('--claude-only', 'Only Claude config, no project scaffold')
    .option('--no-placeholders', 'Skip placeholder replacement')
    .option('--no-mcp', 'Skip MCP configuration')
    .option('-v, --verbose', 'Detailed output')
    .action(runInit);

  return cmd;
}

/**
 * Run init command
 */
async function runInit(path: string | undefined, options: InitOptions): Promise<void> {
  const projectPath = resolvePath(path || '.');

  logger.configure({ verbose: options.verbose, silent: false });

  logger.title('@qazuor/claude-code-config');
  logger.info(`Initializing Claude configuration in ${colors.primary(projectPath)}`);

  // Enable ESC key listener for interactive mode
  if (!options.yes) {
    showCancelHint();
    enableEscListener();
  }

  try {
    // Check for existing configuration
    if (await hasExistingClaudeConfig(projectPath)) {
      if (!options.force) {
        const action = await promptExistingProjectAction();
        if (action === 'skip') {
          logger.info('Keeping existing configuration');
          return;
        }
        if (action !== 'overwrite' && action !== 'merge') {
          return;
        }
      }
    }

    // Detect project
    const detection = await detectProject(projectPath);
    if (detection.detected) {
      logger.newline();
      logger.success(`Detected ${detection.projectType || 'Node.js'} project`);
      if (detection.suggestedBundles && detection.suggestedBundles.length > 0) {
        logger.info(`Suggested bundles: ${colors.primary(detection.suggestedBundles.join(', '))}`);
      }
    }

    // Get templates path (bundled with package)
    const templatesPath = getTemplatesPath();

    // Load module registry
    const registry = await withSpinner(
      'Loading module registry...',
      () => loadRegistry(templatesPath),
      { silent: options.dryRun }
    );

    // Collect configuration through prompts or defaults
    const buildResult = options.yes
      ? await buildDefaultConfig(projectPath, detection, options)
      : await buildInteractiveConfig(projectPath, detection, registry, options);

    if (!buildResult) {
      logger.warn('Configuration cancelled');
      return;
    }

    const { config, skippedMcpConfigs, templateConfig } = buildResult;

    // Store template config in main config
    if (templateConfig) {
      config.templateConfig = templateConfig;
    }

    // Show final summary and confirm
    if (!options.yes && !options.dryRun) {
      const confirmed = await confirmFinalConfiguration(config);
      if (!confirmed) {
        logger.warn('Configuration cancelled');
        return;
      }
    }

    if (options.dryRun) {
      logger.newline();
      logger.title('Dry Run - No changes made');
      showConfigSummary(config);
      return;
    }

    // Execute installation
    await executeInstallation(projectPath, config, registry, templatesPath, options);

    // Apply template configuration (replace {{PLACEHOLDER}} patterns)
    if (templateConfig && !options.noPlaceholders) {
      const claudePath = joinPath(projectPath, '.claude');
      await replaceTemplateConfigWithSpinner(claudePath, templateConfig);

      // Offer to save as global defaults
      if (!options.yes) {
        await promptSaveGlobalDefaults(templateConfig);
      }
    }

    // Check dependencies
    const features = getRequiredFeatures({
      hooks: config.extras.hooks,
      mcp: config.mcp,
    });

    if (features.length > 0) {
      const depReport = await checkFeatureDependencies(features);
      if (depReport.missing.length > 0) {
        logger.newline();
        formatDependencyReport(depReport);
      }
    }

    // Show post-install instructions
    showPostInstallInstructions(config);

    // Show MCP configuration instructions for skipped fields
    if (skippedMcpConfigs.length > 0) {
      showSkippedMcpInstructions(skippedMcpConfigs, config.mcp.level);
    }

    // Disable ESC listener after successful completion
    disableEscListener();
  } catch (error) {
    disableEscListener();
    spinner.fail();
    logger.error(`Initialization failed: ${error instanceof Error ? error.message : error}`);
    process.exit(1);
  }
}

/**
 * Build configuration with defaults (for --yes flag or --bundles flag)
 */
async function buildDefaultConfig(
  projectPath: string,
  detection: Awaited<ReturnType<typeof detectProject>>,
  options: InitOptions
): Promise<ConfigBuildResult> {
  // Determine which bundles to use
  let bundleIds: string[] = [];

  if (options.bundles) {
    // Use bundles from command line
    bundleIds = options.bundles.split(',').map((id) => id.trim());
  } else if (detection.suggestedBundles && detection.suggestedBundles.length > 0) {
    // Use suggested bundles from detection
    bundleIds = detection.suggestedBundles;
  } else {
    // Default minimal bundles
    bundleIds = ['git-workflow', 'testing-minimal', 'quality-minimal'];
  }

  // Resolve bundles to modules
  const resolvedModules = resolveBundles(bundleIds);

  const projectName = (await getProjectName(projectPath)) || 'my-project';
  const projectDesc = (await getProjectDescription(projectPath)) || 'My project';

  // Determine extras based on selected bundles
  const hasPlanning = bundleIds.some((id) => id.includes('planning'));
  const hasTesting = bundleIds.some((id) => id.includes('testing'));

  const config: ClaudeConfig = {
    version: VERSION,
    templateSource: {
      type: 'local',
      installedAt: new Date().toISOString(),
    },
    project: {
      name: projectName,
      description: projectDesc,
      org: 'my-org',
      repo: projectName.toLowerCase().replace(/\s+/g, '-'),
      entityType: 'item',
      entityTypePlural: 'items',
    },
    preferences: {
      language: 'en',
      responseLanguage: 'en',
      includeCoAuthor: true,
    },
    mcp: {
      level: 'project',
      servers: [],
    },
    modules: {
      agents: { selected: resolvedModules.agents, excluded: [] },
      skills: { selected: resolvedModules.skills, excluded: [] },
      commands: { selected: resolvedModules.commands, excluded: [] },
      docs: { selected: resolvedModules.docs, excluded: [] },
    },
    extras: {
      schemas: hasTesting,
      scripts: false,
      hooks: { enabled: false },
      sessions: hasPlanning,
    },
    scaffold: {
      type: options.claudeOnly ? 'claude-only' : 'claude-only',
      createdStructure: [],
    },
    customizations: {
      placeholdersReplaced: false,
      lastUpdated: new Date().toISOString(),
      customFiles: [],
      selectedBundles: bundleIds,
    },
  };

  return {
    config,
    skippedMcpConfigs: [], // No MCP servers in default mode
  };
}

/**
 * Build configuration interactively
 */
async function buildInteractiveConfig(
  projectPath: string,
  detection: Awaited<ReturnType<typeof detectProject>>,
  registry: ModuleRegistry,
  options: InitOptions
): Promise<ConfigBuildResult | null> {
  // Project info
  const projectName = await getProjectName(projectPath);
  const projectDesc = await getProjectDescription(projectPath);

  const projectInfo = await promptProjectInfo({
    defaults: {
      name: projectName,
      description: projectDesc || '',
    },
  });

  const confirmed = await confirmProjectInfo(projectInfo);
  if (!confirmed) {
    return buildInteractiveConfig(projectPath, detection, registry, options);
  }

  // Preferences
  const preferences = await promptPreferences();

  // Scaffold options
  const scaffoldOptions = await promptScaffoldOptions({
    existingProject: detection.detected,
    detectedType: detection.projectType,
    detectedPackageManager: detection.packageManager,
  });

  // Module selection using bundles
  const bundleSelection = await selectModulesWithBundles(registry, detection.suggestedBundles);

  // Determine extras based on selected bundles
  const hasPlanning = bundleSelection.selectedBundles.some((id) => id.includes('planning'));
  const hasTesting = bundleSelection.selectedBundles.some((id) => id.includes('testing'));

  // Hook configuration
  const hookConfig = await promptHookConfig({
    defaults: hasTesting ? { enabled: true } : undefined,
  });

  // MCP configuration
  let mcpConfig: ClaudeConfig['mcp'] = { level: 'project', servers: [] };
  let skippedMcpConfigs: SkippedMcpConfig[] = [];

  if (!options.noMcp) {
    const mcpResult = await promptMcpConfig();
    mcpConfig = mcpResult.config;
    skippedMcpConfigs = mcpResult.skippedConfigs;
  }

  // Permissions configuration
  const permissionsConfig = await promptPermissionsConfig();

  // Code style configuration
  const codeStyleConfig = await promptCodeStyleConfig();

  // Template configuration ({{PLACEHOLDER}} values)
  logger.newline();
  const configContext = await buildConfigContext(projectPath);
  const templateConfigResult = await promptTemplateConfig({
    context: configContext,
    mode: 'quick',
  });

  // Resolve bundles to modules
  const resolvedModules = resolveBundles(bundleSelection.selectedBundles);

  // Merge with additional individual modules
  const modules = {
    agents: [...new Set([...resolvedModules.agents, ...bundleSelection.additionalModules.agents])],
    skills: [...new Set([...resolvedModules.skills, ...bundleSelection.additionalModules.skills])],
    commands: [
      ...new Set([...resolvedModules.commands, ...bundleSelection.additionalModules.commands]),
    ],
    docs: [...new Set([...resolvedModules.docs, ...bundleSelection.additionalModules.docs])],
  };

  const config: ClaudeConfig = {
    version: VERSION,
    templateSource: {
      type: 'local',
      installedAt: new Date().toISOString(),
    },
    project: projectInfo,
    preferences,
    mcp: mcpConfig,
    modules: {
      agents: { selected: modules.agents, excluded: [] },
      skills: { selected: modules.skills, excluded: [] },
      commands: { selected: modules.commands, excluded: [] },
      docs: { selected: modules.docs, excluded: [] },
    },
    extras: {
      schemas: hasTesting,
      scripts: false,
      hooks: hookConfig,
      sessions: hasPlanning,
      codeStyle: codeStyleConfig,
    },
    scaffold: {
      type: scaffoldOptions.type,
      createdStructure: [],
    },
    customizations: {
      placeholdersReplaced: false,
      lastUpdated: new Date().toISOString(),
      customFiles: [],
      permissions: permissionsConfig,
      selectedBundles: bundleSelection.selectedBundles,
    },
  };

  return {
    config,
    skippedMcpConfigs,
    templateConfig: templateConfigResult,
  };
}

/**
 * Select modules using bundle system
 */
async function selectModulesWithBundles(
  registry: ModuleRegistry,
  suggestedBundles?: string[]
): Promise<BundleSelectionResult> {
  const categories: ModuleCategory[] = ['agents', 'skills', 'commands', 'docs'];

  // Ask how to select modules
  const mode = await promptBundleMode();

  const result: BundleSelectionResult = {
    selectedBundles: [],
    additionalModules: {
      agents: [],
      skills: [],
      commands: [],
      docs: [],
    },
  };

  if (mode === 'bundles' || mode === 'both') {
    // Show suggested bundles if available
    if (suggestedBundles && suggestedBundles.length > 0) {
      logger.newline();
      logger.info(
        colors.muted(`Suggested bundles based on your project: ${suggestedBundles.join(', ')}`)
      );
    }

    // Quick bundle selection or full selection
    result.selectedBundles = await promptQuickBundleSelection();

    // Show summary
    if (result.selectedBundles.length > 0) {
      showBundlesSummary(result.selectedBundles);
    }
  }

  if (mode === 'individual' || mode === 'both') {
    // Get preselected from bundles
    const preselectedFromBundles = resolveBundles(result.selectedBundles);

    // Individual selection per category
    logger.newline();
    logger.subtitle('Individual Module Selection');

    for (const category of categories) {
      const preselected =
        mode === 'both'
          ? preselectedFromBundles[category as keyof typeof preselectedFromBundles]
          : [];

      const categoryResult = await selectItemsFromCategory(category, registry[category], {
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

  return result;
}

/**
 * Execute the installation
 */
async function executeInstallation(
  projectPath: string,
  config: ClaudeConfig,
  registry: ModuleRegistry,
  templatesPath: string,
  options: InitOptions
): Promise<void> {
  logger.newline();
  logger.title('Installing Configuration');

  // Generate scaffold if needed
  if (config.scaffold.type === 'full-project') {
    const scaffoldResult = await generateScaffoldWithProgress(projectPath, {
      type: config.scaffold.type,
    });
    config.scaffold.createdStructure = [
      ...scaffoldResult.createdDirs,
      ...scaffoldResult.createdFiles,
    ];
  }

  // Resolve modules (tags -> actual module definitions)
  const modulesByCategory: Record<ModuleCategory, ModuleDefinition[]> = {
    agents: filterModules(registry, 'agents', config.modules.agents.selected),
    skills: filterModules(registry, 'skills', config.modules.skills.selected),
    commands: filterModules(registry, 'commands', config.modules.commands.selected),
    docs: filterModules(registry, 'docs', config.modules.docs.selected),
  };

  // Install modules
  const installResults = await installAllModules(modulesByCategory, {
    templatesPath,
    targetPath: projectPath,
    overwrite: options.force,
  });

  // Update config with actual installed module IDs (not tags)
  config.modules.agents.selected = installResults.agents?.installed ?? [];
  config.modules.skills.selected = installResults.skills?.installed ?? [];
  config.modules.commands.selected = installResults.commands?.installed ?? [];
  config.modules.docs.selected = installResults.docs?.installed ?? [];

  // Install extras
  await installExtras(
    {
      schemas: config.extras.schemas,
      scripts: config.extras.scripts,
      hooks: config.extras.hooks.enabled,
      sessions: config.extras.sessions,
    },
    {
      templatesPath,
      targetPath: projectPath,
      overwrite: options.force,
    }
  );

  // Replace placeholders
  if (!options.noPlaceholders) {
    const claudePath = joinPath(projectPath, '.claude');
    const report = await replacePlaceholders(claudePath, config.project);
    config.customizations.placeholdersReplaced = true;

    if (options.verbose) {
      showReplacementReport(report);
    }
  }

  // Install hooks
  if (config.extras.hooks.enabled) {
    const hookResult = await installHooks(projectPath, config.extras.hooks);
    if (hookResult.errors.length > 0) {
      logger.warn(`Hook installation warnings: ${hookResult.errors.join(', ')}`);
    }
  }

  // Install MCP servers
  if (config.mcp.servers.length > 0) {
    const mcpResult = await installMcpServers(projectPath, config.mcp);
    if (!mcpResult.success) {
      logger.warn(`MCP installation warnings: ${mcpResult.errors.join(', ')}`);
    }
  }

  // Install permissions
  const permissions = config.customizations.permissions;
  if (permissions) {
    await installPermissions(projectPath, permissions, 'project');
  }

  // Set co-author setting
  await setCoAuthorSetting(projectPath, config.preferences.includeCoAuthor, 'project');

  // Install code style configurations
  if (config.extras.codeStyle?.enabled) {
    const codeStyleResult = await installCodeStyle(projectPath, config.extras.codeStyle, {
      overwrite: options.force,
    });
    if (codeStyleResult.errors.length > 0) {
      logger.warn(`Code style installation warnings: ${codeStyleResult.errors.join(', ')}`);
    }
  }

  // Write config
  await writeConfig(projectPath, config);

  logger.newline();
  logger.success('Configuration installed successfully!');

  // Show code style instructions if needed
  if (config.extras.codeStyle?.enabled) {
    showCodeStyleInstructions(config.extras.codeStyle);
  }
}

/**
 * Show config summary
 */
function showConfigSummary(config: ClaudeConfig): void {
  logger.subtitle('Configuration');
  logger.keyValue('Project', config.project.name);
  logger.keyValue('Preset', 'custom');
  logger.keyValue('Agents', String(config.modules.agents.selected.length));
  logger.keyValue('Skills', String(config.modules.skills.selected.length));
  logger.keyValue('Commands', String(config.modules.commands.selected.length));
  logger.keyValue('Docs', String(config.modules.docs.selected.length));
}
