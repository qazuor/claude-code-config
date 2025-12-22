/**
 * Init command - initialize Claude configuration
 */

import { Command } from 'commander';
import { resolveBundles } from '../../lib/bundles/resolver.js';
import { type CICDConfig, installCICDWithSpinner } from '../../lib/ci-cd/index.js';
import { installCodeStyle, showCodeStyleInstructions } from '../../lib/code-style/index.js';
import { installVSCodeConfig } from '../../lib/code-style/vscode-installer.js';
import { readConfig, writeConfig } from '../../lib/config/index.js';
import {
  checkFeatureDependencies,
  formatDependencyReport,
  formatManualInstallInstructions,
  getRequiredFeatures,
  installDependencies,
} from '../../lib/dependencies/index.js';
import {
  deriveHuskyConfigFromCodeStyle,
  installHuskyWithSpinner,
} from '../../lib/git-hooks/index.js';
import { installHooks } from '../../lib/hooks/index.js';
import { installMcpServers } from '../../lib/mcp/index.js';
import { filterModules, loadRegistry } from '../../lib/modules/index.js';
import { installAllModules, installExtras } from '../../lib/modules/installer.js';
import {
  deriveToolSelectionFromCodeStyle,
  generatePackageJsonChanges,
  getInstallCommand,
  getSetupInstructions,
  readPackageJson,
  updatePackageJson,
} from '../../lib/npm/index.js';
import { installPermissions, setCoAuthorSetting } from '../../lib/permissions/index.js';
import { replacePlaceholders, showReplacementReport } from '../../lib/placeholders/index.js';
import { generateClaudeMdWithSpinner } from '../../lib/scaffold/claude-md-generator.js';
import {
  detectProject,
  generateScaffoldWithProgress,
  getProjectDescription,
  getProjectName,
  hasExistingClaudeConfig,
} from '../../lib/scaffold/index.js';
import {
  generateSettingsLocalWithSpinner,
  generateSettingsWithSpinner,
} from '../../lib/scaffold/settings-generator.js';
import { replaceTemplateConfigWithSpinner } from '../../lib/templates/config-replacer.js';
import { joinPath, resolvePath } from '../../lib/utils/fs.js';
import { colors, logger } from '../../lib/utils/logger.js';
import { getTemplatesPath } from '../../lib/utils/paths.js';
import {
  cleanup,
  confirm,
  setupGracefulCancellation,
  showCancelHint,
} from '../../lib/utils/prompt-cancel.js';
import { spinner, withSpinner } from '../../lib/utils/spinner.js';
import { runWizard, showWizardSummary } from '../../lib/wizard/index.js';
import {
  type InitWizardContext,
  type InitWizardValues,
  createInitWizardConfig,
} from '../../lib/wizard/init-steps.js';
import type { ClaudeSettingsConfig } from '../../types/claude-settings.js';
import type { ClaudeConfig } from '../../types/config.js';
import type { ModuleCategory, ModuleDefinition, ModuleRegistry } from '../../types/modules.js';
import type { DependencyGenerationConfig, ToolSelection } from '../../types/package-json.js';
import type { TemplateConfig } from '../../types/template-config.js';
import {
  type SkippedMcpConfig,
  confirmFinalConfiguration,
  promptExistingProjectAction,
  showPostInstallInstructions,
  showSkippedMcpInstructions,
} from '../prompts/index.js';
import { promptSaveGlobalDefaults } from '../prompts/template-config.js';

/** Extended config result that includes skipped MCP configurations */
interface ConfigBuildResult {
  config: ClaudeConfig;
  skippedMcpConfigs: SkippedMcpConfig[];
  templateConfig?: Partial<TemplateConfig>;
  cicdConfig?: CICDConfig;
  claudeSettings?: ClaudeSettingsConfig;
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

  // Setup graceful cancellation for interactive mode
  if (!options.yes) {
    setupGracefulCancellation();
    showCancelHint();
  }

  try {
    // Check for existing configuration and read it for defaults
    let existingConfig: ClaudeConfig | null = null;

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

        // Read existing config to use as defaults (for both merge and overwrite)
        existingConfig = await readConfig(projectPath);
        if (existingConfig) {
          logger.info('Using existing configuration as defaults');
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
      : await buildInteractiveConfig(projectPath, detection, registry, options, existingConfig);

    if (!buildResult) {
      logger.warn('Configuration cancelled');
      return;
    }

    const { config, skippedMcpConfigs, templateConfig, cicdConfig, claudeSettings } = buildResult;

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
    await executeInstallation(
      projectPath,
      config,
      registry,
      templatesPath,
      options,
      cicdConfig,
      claudeSettings
    );

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
        logger.section('System Dependencies', '🔧');
        logger.warn(`Found ${depReport.missing.length} missing system dependencies`);
        logger.newline();

        // Show what's missing
        for (const dep of depReport.missing) {
          logger.item(`${dep.name} - ${dep.description}`);
        }
        logger.newline();

        if (!options.yes) {
          const shouldInstall = await confirm({
            message: 'Would you like to try installing these dependencies now?',
            default: true,
          });

          if (shouldInstall) {
            logger.newline();
            const results = await installDependencies(depReport.missing, {
              onProgress: (dep, index, total) => {
                spinner.start(`Installing ${dep.name} (${index + 1}/${total})...`);
              },
            });

            const successful = results.filter((r) => r.success);
            const failed = results.filter((r) => !r.success);

            if (successful.length > 0) {
              spinner.succeed(`Installed ${successful.length} dependencies successfully`);
            }

            if (failed.length > 0) {
              spinner.fail(`Failed to install ${failed.length} dependencies`);
              logger.newline();
              logger.warn('The following dependencies could not be installed automatically:');
              for (const result of failed) {
                logger.item(`${result.dep.name}: ${result.error}`);
              }

              // Show manual instructions for failed ones
              const failedReport = {
                ...depReport,
                missing: failed.map((r) => r.dep),
              };
              logger.newline();
              formatDependencyReport(failedReport);
            }
          } else {
            // User chose not to install - show manual instructions
            logger.newline();
            logger.info('You can install them later using the following commands:');
            const instructions = formatManualInstallInstructions(depReport);
            for (const line of instructions) {
              logger.raw(line);
            }
          }
        } else {
          // Non-interactive mode - just show the report
          formatDependencyReport(depReport);
        }
      }
    }

    // Show post-install instructions
    showPostInstallInstructions(config);

    // Show MCP configuration instructions for skipped fields
    if (skippedMcpConfigs.length > 0) {
      showSkippedMcpInstructions(skippedMcpConfigs, config.mcp.level);
    }

    // Cleanup after successful completion
    cleanup();
  } catch (error) {
    cleanup();
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
 * Build configuration interactively using wizard with back navigation
 */
async function buildInteractiveConfig(
  projectPath: string,
  detection: Awaited<ReturnType<typeof detectProject>>,
  registry: ModuleRegistry,
  options: InitOptions,
  existingConfig?: ClaudeConfig | null
): Promise<ConfigBuildResult | null> {
  // Get initial project info for defaults
  const projectName = await getProjectName(projectPath);
  const projectDesc = await getProjectDescription(projectPath);

  // Create wizard configuration
  const wizardConfig = createInitWizardConfig(
    projectPath,
    {
      detected: detection.detected,
      projectType: detection.projectType,
      packageManager: detection.packageManager,
      suggestedBundles: detection.suggestedBundles,
      detectedTechnologies: detection.detectedTechnologies,
    },
    registry
  );

  // Use existing config values as defaults if available
  const existingProject = existingConfig?.project;
  const existingPrefs = existingConfig?.preferences;

  // Initial context with detected values, existing config, and project info
  const initialContext: Partial<InitWizardContext> = {
    projectPath,
    registry,
    detection: {
      detected: detection.detected,
      projectType: detection.projectType,
      packageManager: existingPrefs?.packageManager || detection.packageManager,
      suggestedBundles: detection.suggestedBundles,
      detectedTechnologies: detection.detectedTechnologies,
    },
    // Use existing project info as defaults, fallback to detected values
    projectInfo: {
      name: existingProject?.name || projectName || '',
      description: existingProject?.description || projectDesc || '',
      org: existingProject?.org || '',
      repo: existingProject?.repo || projectName?.toLowerCase().replace(/\s+/g, '-') || '',
      entityType: existingProject?.entityType || 'item',
      entityTypePlural: existingProject?.entityTypePlural || 'items',
      domain: existingProject?.domain,
      location: existingProject?.location,
      author: existingProject?.author,
    },
    // Use existing preferences as defaults
    preferences: existingPrefs
      ? {
          language: existingPrefs.language,
          responseLanguage: existingPrefs.responseLanguage,
          includeCoAuthor: existingPrefs.includeCoAuthor,
          packageManager: existingPrefs.packageManager,
        }
      : undefined,
    // Use existing hook config as defaults
    hookConfig: existingConfig?.extras?.hooks,
    // Use existing code style config as defaults
    codeStyleConfig: existingConfig?.extras?.codeStyle,
    // Use existing folder preferences as defaults
    folderPreferences: existingConfig?.extras?.folderPreferences,
    // Use existing permissions config as defaults
    permissionsConfig: existingConfig?.customizations?.permissions,
  };

  // Run the wizard with explicit types
  const wizardResult = await runWizard<InitWizardValues, InitWizardContext>(
    wizardConfig,
    initialContext
  );

  if (wizardResult.cancelled) {
    return null;
  }

  // Show wizard completion summary
  showWizardSummary(wizardResult.state);

  // Extract values from wizard result
  const {
    projectInfo,
    preferences,
    scaffoldOptions,
    bundleSelection,
    hookConfig,
    mcpConfig: mcpResult,
    permissionsConfig,
    codeStyleConfig,
    cicdConfig,
    folderPreferences,
    templateConfig: templateConfigResult,
    claudeSettings,
  } = wizardResult.values;

  // Handle MCP skip option
  let mcpConfig: ClaudeConfig['mcp'] = { level: 'project', servers: [] };
  let skippedMcpConfigs: SkippedMcpConfig[] = [];

  if (!options.noMcp && mcpResult) {
    mcpConfig = mcpResult.config;
    skippedMcpConfigs = mcpResult.skippedConfigs;
  }

  // Determine extras based on selected bundles
  const hasPlanning = bundleSelection.selectedBundles.some((id) => id.includes('planning'));
  const hasTesting = bundleSelection.selectedBundles.some((id) => id.includes('testing'));

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
      folderPreferences: folderPreferences || undefined,
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
    cicdConfig,
    claudeSettings,
  };
}

/**
 * Execute the installation
 */
async function executeInstallation(
  projectPath: string,
  config: ClaudeConfig,
  registry: ModuleRegistry,
  templatesPath: string,
  options: InitOptions,
  cicdConfig?: CICDConfig,
  claudeSettings?: ClaudeSettingsConfig
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

  // Generate CLAUDE.md in project root
  const claudeMdResult = await generateClaudeMdWithSpinner(projectPath, config.project, {
    overwrite: options.force,
    templateConfig: config.templateConfig,
    claudeConfig: config,
  });
  if (claudeMdResult.error) {
    logger.warn(`CLAUDE.md generation warning: ${claudeMdResult.error}`);
  } else if (claudeMdResult.skipped) {
    logger.info('CLAUDE.md already exists, skipped');
  }

  // Generate settings.json and settings.local.json
  if (claudeSettings) {
    const settingsResult = await generateSettingsWithSpinner(projectPath, {
      claudeSettings,
      includeCoAuthor: config.preferences.includeCoAuthor,
      overwrite: options.force,
    });
    if (settingsResult.error) {
      logger.warn(`settings.json generation warning: ${settingsResult.error}`);
    } else if (settingsResult.skipped) {
      logger.info('settings.json already exists, skipped');
    }

    const settingsLocalResult = await generateSettingsLocalWithSpinner(projectPath, {
      claudeSettings,
      includeCoAuthor: config.preferences.includeCoAuthor,
      overwrite: options.force,
    });
    if (settingsLocalResult.error) {
      logger.warn(`settings.local.json generation warning: ${settingsLocalResult.error}`);
    } else if (settingsLocalResult.skipped) {
      logger.info('settings.local.json already exists, skipped');
    }
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

    // Install VSCode settings for code style tools
    const vscodeResult = await installVSCodeConfig(projectPath, config.extras.codeStyle, {
      overwrite: options.force,
      merge: !options.force, // Merge with existing settings if not forcing
    });
    if (vscodeResult.settings.error) {
      logger.warn(`VSCode settings warning: ${vscodeResult.settings.error}`);
    } else if (vscodeResult.settings.created || vscodeResult.settings.updated) {
      logger.info('VSCode settings configured for code style tools');
    }

    // Install Husky hooks if commitlint with husky integration is enabled
    const huskyConfig = deriveHuskyConfigFromCodeStyle(config.extras.codeStyle);
    if (huskyConfig) {
      const huskyResult = await installHuskyWithSpinner(projectPath, huskyConfig, {
        overwrite: options.force,
      });
      if (huskyResult.errors.length > 0) {
        logger.warn(`Husky installation warnings: ${huskyResult.errors.join(', ')}`);
      }
    }
  }

  // Install CI/CD workflows
  if (cicdConfig?.enabled) {
    const cicdResult = await installCICDWithSpinner(projectPath, cicdConfig, {
      overwrite: options.force,
    });
    if (cicdResult.errors.length > 0) {
      logger.warn(`CI/CD installation warnings: ${cicdResult.errors.join(', ')}`);
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

  // Update package.json with dependencies if code style tools are enabled
  if (config.extras.codeStyle?.enabled) {
    await handlePackageJsonUpdate(projectPath, config, options);
  }
}

/**
 * Handle package.json update with code style dependencies
 */
async function handlePackageJsonUpdate(
  projectPath: string,
  config: ClaudeConfig,
  options: InitOptions
): Promise<void> {
  const codeStyle = config.extras.codeStyle;
  if (!codeStyle?.enabled) return;

  // Derive tool selection from code style config
  const toolSelection = deriveToolSelectionFromCodeStyle({
    biome: codeStyle.biome,
    prettier: codeStyle.prettier,
    commitlint: codeStyle.commitlint,
  });

  // Check if there are any tools selected
  const hasTools = toolSelection.linter || toolSelection.formatter || toolSelection.commitlint;
  if (!hasTools) return;

  // Generate package.json changes
  const packageManager = config.preferences.packageManager || 'pnpm';
  const depConfig: DependencyGenerationConfig = {
    tools: toolSelection as ToolSelection,
    packageManager,
    project: {
      name: config.project.name,
      description: config.project.description,
      author: config.project.author,
      repository:
        config.project.org && config.project.repo
          ? `https://github.com/${config.project.org}/${config.project.repo}`
          : undefined,
    },
  };

  const changes = generatePackageJsonChanges(depConfig);

  // Check if there are any changes to make
  const hasChanges =
    Object.keys(changes.scripts || {}).length > 0 ||
    Object.keys(changes.dependencies || {}).length > 0 ||
    Object.keys(changes.devDependencies || {}).length > 0;

  if (!hasChanges) return;

  // Show what would be added
  logger.newline();
  logger.section('Package.json Updates', '📦');

  // Check if package.json exists
  const existingPackageJson = await readPackageJson(projectPath);
  const packageJsonExists = existingPackageJson !== null;

  if (!packageJsonExists) {
    logger.info('No package.json found. A new one will be created.');
  }

  // Show proposed devDependencies
  if (changes.devDependencies && Object.keys(changes.devDependencies).length > 0) {
    logger.subtitle('Dev Dependencies to add:');
    for (const [name, version] of Object.entries(changes.devDependencies)) {
      logger.item(`${name}@${version}`);
    }
  }

  // Show proposed scripts
  if (changes.scripts && Object.keys(changes.scripts).length > 0) {
    logger.newline();
    logger.subtitle('Scripts to add:');
    for (const [name, command] of Object.entries(changes.scripts)) {
      logger.item(`${name}: ${command}`);
    }
  }

  // Ask user if they want to update package.json
  if (!options.yes) {
    logger.newline();
    const shouldUpdate = await confirm({
      message: packageJsonExists
        ? 'Would you like to update package.json with these changes?'
        : 'Would you like to create package.json with these settings?',
      default: true,
    });

    if (!shouldUpdate) {
      logger.info('Skipped package.json update. You can add these manually later.');
      showManualDependencyInstructions(changes, packageManager, toolSelection as ToolSelection);
      return;
    }
  }

  // Apply changes
  if (!options.dryRun) {
    const result = await updatePackageJson(projectPath, changes, {
      scriptsMerge: 'skip-existing',
      dependenciesMerge: 'skip-existing',
      createIfMissing: true,
    });

    if (result.success) {
      if (result.created) {
        logger.success('Created package.json');
      } else if (result.modified) {
        logger.success('Updated package.json');
      }

      // Show what was added/skipped
      if (result.addedDevDependencies.length > 0) {
        logger.info(`Added ${result.addedDevDependencies.length} dev dependencies`);
      }
      if (result.skippedDevDependencies.length > 0) {
        logger.info(
          `Skipped ${result.skippedDevDependencies.length} existing dependencies: ${result.skippedDevDependencies.join(', ')}`
        );
      }
      if (result.addedScripts.length > 0) {
        logger.info(`Added ${result.addedScripts.length} scripts`);
      }
      if (result.skippedScripts.length > 0) {
        logger.info(
          `Skipped ${result.skippedScripts.length} existing scripts: ${result.skippedScripts.join(', ')}`
        );
      }

      // Show install command
      logger.newline();
      logger.subtitle('Next Steps');
      logger.info('Run the following command to install dependencies:');
      logger.raw(`  ${getInstallCommand(packageManager)}`);

      // Show setup instructions if any
      const setupInstructions = getSetupInstructions(toolSelection as ToolSelection);
      if (setupInstructions.length > 0) {
        logger.newline();
        logger.subtitle('Additional Setup');
        for (const instruction of setupInstructions) {
          logger.raw(`  ${instruction}`);
        }
      }
    } else {
      logger.warn(`Failed to update package.json: ${result.error}`);
      showManualDependencyInstructions(changes, packageManager, toolSelection as ToolSelection);
    }
  } else {
    logger.info('Dry run - package.json would be updated with above changes');
  }
}

/**
 * Show manual instructions for adding dependencies
 */
function showManualDependencyInstructions(
  changes: ReturnType<typeof generatePackageJsonChanges>,
  packageManager: 'npm' | 'yarn' | 'pnpm' | 'bun',
  toolSelection: ToolSelection
): void {
  logger.newline();
  logger.subtitle('Manual Installation');

  // Show install command for dependencies
  if (changes.devDependencies && Object.keys(changes.devDependencies).length > 0) {
    const pkgNames = Object.keys(changes.devDependencies).join(' ');
    let installCmd: string;
    switch (packageManager) {
      case 'npm':
        installCmd = `npm install -D ${pkgNames}`;
        break;
      case 'yarn':
        installCmd = `yarn add -D ${pkgNames}`;
        break;
      case 'pnpm':
        installCmd = `pnpm add -D ${pkgNames}`;
        break;
      case 'bun':
        installCmd = `bun add -D ${pkgNames}`;
        break;
      default:
        installCmd = `npm install -D ${pkgNames}`;
    }
    logger.info('Install dev dependencies:');
    logger.raw(`  ${installCmd}`);
  }

  // Show scripts to add
  if (changes.scripts && Object.keys(changes.scripts).length > 0) {
    logger.newline();
    logger.info('Add these scripts to package.json:');
    for (const [name, command] of Object.entries(changes.scripts)) {
      logger.raw(`  "${name}": "${command}"`);
    }
  }

  // Show setup instructions
  const setupInstructions = getSetupInstructions(toolSelection);
  if (setupInstructions.length > 0) {
    logger.newline();
    logger.subtitle('Additional Setup');
    for (const instruction of setupInstructions) {
      logger.raw(`  ${instruction}`);
    }
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
