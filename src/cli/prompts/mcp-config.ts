/**
 * MCP server configuration prompts
 */

import { MCP_SERVERS, getMcpServer } from '../../constants/mcp-servers.js';
import { getInstalledMcpServers } from '../../lib/mcp/configurator.js';
import { colors, logger } from '../../lib/utils/logger.js';
import { checkbox, confirm, input, password, select } from '../../lib/utils/prompt-cancel.js';
import type { McpConfig } from '../../types/config.js';
import type { McpConfigField, McpInstallation, McpServerDefinition } from '../../types/mcp.js';

interface McpPromptOptions {
  defaults?: Partial<McpConfig>;
  /** Project path (used to check installed servers) */
  projectPath?: string;
}

/** Track servers with skipped configuration */
export interface McpConfigResult {
  config: McpConfig;
  skippedConfigs: SkippedMcpConfig[];
}

/** Information about a skipped MCP server configuration */
export interface SkippedMcpConfig {
  serverId: string;
  serverName: string;
  skippedFields: SkippedField[];
  installInstructions?: string;
}

/** A single skipped configuration field */
export interface SkippedField {
  name: string;
  description: string;
  envVar?: string;
  howToGet?: string;
}

/**
 * Prompt for MCP configuration
 * Returns both the config and information about any skipped configurations
 */
export async function promptMcpConfig(options?: McpPromptOptions): Promise<McpConfigResult> {
  logger.section('MCP Servers', '🔌');

  const enableMcp = await confirm({
    message: 'Do you want to configure MCP servers?',
    default: true,
  });

  if (!enableMcp) {
    return {
      config: {
        level: 'project',
        servers: [],
      },
      skippedConfigs: [],
    };
  }

  // Get already installed MCP servers at both user and project level
  const projectPath = options?.projectPath || process.cwd();
  const installedServers = await getInstalledMcpServers(projectPath);
  const userInstalledSet = new Set(installedServers.user);
  const projectInstalledSet = new Set(installedServers.project);

  // Select installation level
  const level = await select({
    message: 'Where should MCP servers be configured?',
    choices: [
      {
        name: 'Project level (.claude/settings.local.json)',
        value: 'project' as const,
        description: 'Specific to this project',
      },
      {
        name: 'User level (~/.claude/settings.json)',
        value: 'user' as const,
        description: 'Available in all projects',
      },
    ],
    default: options?.defaults?.level || 'project',
  });

  // Group servers by category for display
  const serversByCategory = groupServersByCategory();
  const selectedServerIds: string[] = [];

  logger.newline();
  logger.info('Select MCP servers to install:');

  // Show info about already installed servers
  const totalInstalled = userInstalledSet.size + projectInstalledSet.size;
  if (totalInstalled > 0) {
    const parts: string[] = [];
    if (userInstalledSet.size > 0) {
      parts.push(`${userInstalledSet.size} at user level`);
    }
    if (projectInstalledSet.size > 0) {
      parts.push(`${projectInstalledSet.size} at project level`);
    }
    logger.info(colors.muted(`  (${parts.join(', ')} already installed)`));
  }
  logger.newline();

  // Show grouped selection
  for (const [category, servers] of Object.entries(serversByCategory)) {
    const choices = servers.map((s) => {
      const isInstalledAtUserLevel = userInstalledSet.has(s.id);
      const isInstalledAtProjectLevel = projectInstalledSet.has(s.id);

      // If already installed at user level, disable it
      if (isInstalledAtUserLevel) {
        return {
          name: `${s.name} - ${s.description} ${colors.muted('(already installed at user level)')}`,
          value: s.id,
          checked: false,
          disabled: 'already installed at user level',
        };
      }

      // If already installed at project level, disable it
      if (isInstalledAtProjectLevel) {
        return {
          name: `${s.name} - ${s.description} ${colors.muted('(already installed at project level)')}`,
          value: s.id,
          checked: false,
          disabled: 'already installed at project level',
        };
      }

      return {
        name: `${s.name} - ${s.description}`,
        value: s.id,
        checked: options?.defaults?.servers?.some((i) => i.serverId === s.id) ?? false,
      };
    });

    const categoryLabel = formatCategory(category);
    const selected = await checkbox({
      message: `${categoryLabel}:`,
      choices,
    });

    selectedServerIds.push(...selected);
  }

  // Ask about custom server
  const wantCustom = await confirm({
    message: 'Do you want to add a custom MCP server?',
    default: false,
  });

  const installations: McpInstallation[] = [];
  const skippedConfigs: SkippedMcpConfig[] = [];

  // Configure selected servers
  for (const serverId of selectedServerIds) {
    const server = getMcpServer(serverId);
    if (server) {
      const result = await configureServer(server, level);
      installations.push(result.installation);
      if (result.skippedConfig) {
        skippedConfigs.push(result.skippedConfig);
      }
    }
  }

  // Configure custom server
  if (wantCustom) {
    const customInstallation = await promptCustomServer(level);
    if (customInstallation) {
      installations.push(customInstallation);
    }
  }

  return {
    config: {
      level,
      servers: installations,
    },
    skippedConfigs,
  };
}

/**
 * Group servers by category
 */
function groupServersByCategory(): Record<string, McpServerDefinition[]> {
  const groups: Record<string, McpServerDefinition[]> = {};

  for (const server of MCP_SERVERS) {
    if (!groups[server.category]) {
      groups[server.category] = [];
    }
    groups[server.category].push(server);
  }

  return groups;
}

/**
 * Format category name for display
 */
function formatCategory(category: string): string {
  const labels: Record<string, string> = {
    documentation: '📚 Documentation',
    database: '🗄️  Database',
    cache: '💾 Cache & Key-Value',
    'version-control': '🔄 Version Control',
    deployment: '🚀 Deployment',
    infrastructure: '🏗️  Infrastructure',
    'project-mgmt': '📋 Project Management',
    monitoring: '📊 Monitoring',
    testing: '🧪 Testing & Browser',
    security: '🔐 Security',
    communication: '💬 Communication',
    design: '🎨 Design',
    payments: '💳 Payments',
    search: '🔍 Search',
    ai: '🤖 AI & ML',
    custom: '⚙️  Custom',
  };
  return labels[category] || category;
}

/** Result from configuring a single server */
interface ConfigureServerResult {
  installation: McpInstallation;
  skippedConfig: SkippedMcpConfig | null;
}

/**
 * Configure a single MCP server
 * Fields are optional - skipped fields are tracked for post-install instructions
 */
async function configureServer(
  server: McpServerDefinition,
  level: 'user' | 'project'
): Promise<ConfigureServerResult> {
  const config: Record<string, unknown> = {};
  const skippedFields: SkippedField[] = [];

  if (server.requiresConfig && server.configFields) {
    logger.newline();
    logger.info(`Configuring ${colors.primary(server.name)}...`);
    logger.info(
      colors.muted(
        '  (Press Enter to skip optional fields - instructions will be shown at the end)'
      )
    );

    for (const field of server.configFields) {
      const result = await promptConfigFieldOptional(field);
      if (result.value !== undefined && result.value !== '') {
        config[field.name] = result.value;
      } else if (result.skipped) {
        skippedFields.push({
          name: field.name,
          description: field.description,
          envVar: field.envVar,
        });
      }
    }
  }

  const installation: McpInstallation = {
    serverId: server.id,
    level,
    config,
  };

  const skippedConfig: SkippedMcpConfig | null =
    skippedFields.length > 0
      ? {
          serverId: server.id,
          serverName: server.name,
          skippedFields,
          installInstructions: server.installInstructions,
        }
      : null;

  return { installation, skippedConfig };
}

/** Result from prompting a config field */
interface PromptFieldResult {
  value: string | boolean | number | undefined;
  skipped: boolean;
}

/**
 * Prompt for a config field value (all fields are optional)
 * Returns both the value and whether it was skipped
 */
async function promptConfigFieldOptional(field: McpConfigField): Promise<PromptFieldResult> {
  const envHint = field.envVar ? colors.muted(` (env: ${field.envVar})`) : '';
  const optionalHint = colors.muted(' [optional]');

  // Try to get from environment
  const envValue = field.envVar ? process.env[field.envVar] : undefined;

  if (field.type === 'boolean') {
    const value = await confirm({
      message: `${field.description}${envHint}:`,
      default: (field.default as boolean) ?? false,
    });
    return { value, skipped: false };
  }

  if (field.type === 'number') {
    const value = await input({
      message: `${field.description}${envHint}${optionalHint}:`,
      default: envValue || (field.default as string) || '',
    });
    if (!value.trim()) {
      return { value: undefined, skipped: true };
    }
    if (Number.isNaN(Number(value))) {
      logger.warn('Invalid number, skipping field');
      return { value: undefined, skipped: true };
    }
    return { value: Number(value), skipped: false };
  }

  // String type - use password input for sensitive fields
  const isSensitive =
    field.name.toLowerCase().includes('token') ||
    field.name.toLowerCase().includes('key') ||
    field.name.toLowerCase().includes('secret') ||
    field.name.toLowerCase().includes('password');

  if (isSensitive) {
    if (envValue) {
      const useEnv = await confirm({
        message: `Found ${field.envVar} in environment. Use it?`,
        default: true,
      });
      if (useEnv) return { value: envValue, skipped: false };
    }

    const value = await password({
      message: `${field.description}${envHint}${optionalHint}:`,
    });
    if (!value.trim()) {
      return { value: undefined, skipped: true };
    }
    return { value, skipped: false };
  }

  const value = await input({
    message: `${field.description}${envHint}${optionalHint}:`,
    default: envValue || (field.default as string) || '',
  });
  if (!value.trim()) {
    return { value: undefined, skipped: true };
  }
  return { value, skipped: false };
}

/**
 * Prompt for custom MCP server
 */
async function promptCustomServer(level: 'user' | 'project'): Promise<McpInstallation | null> {
  logger.newline();
  logger.info('Configure custom MCP server');

  const serverId = await input({
    message: 'Server ID (unique identifier):',
    validate: (v) => {
      if (!v.trim()) return 'Server ID is required';
      if (!/^[a-z0-9-]+$/.test(v)) return 'Use lowercase letters, numbers, and dashes only';
      return true;
    },
  });

  const packageName = await input({
    message: 'NPM package or command:',
    validate: (v) => (v.trim() ? true : 'Package name is required'),
  });

  const hasConfig = await confirm({
    message: 'Does this server require configuration?',
    default: false,
  });

  const config: Record<string, unknown> = {
    package: packageName,
  };

  if (hasConfig) {
    let addMore = true;
    while (addMore) {
      const fieldName = await input({
        message: 'Config field name:',
      });

      if (fieldName.trim()) {
        const fieldValue = await input({
          message: `Value for ${fieldName}:`,
        });
        config[fieldName] = fieldValue;
      }

      addMore = await confirm({
        message: 'Add another config field?',
        default: false,
      });
    }
  }

  return {
    serverId,
    level,
    config,
  };
}

/**
 * Show MCP configuration summary
 */
export function showMcpSummary(config: McpConfig): void {
  logger.newline();
  logger.subtitle('MCP Configuration Summary');

  if (config.servers.length === 0) {
    logger.info('No MCP servers configured');
    return;
  }

  logger.keyValue('Level', config.level === 'user' ? 'User (~/.claude/)' : 'Project (.claude/)');
  logger.newline();

  for (const installation of config.servers) {
    const server = getMcpServer(installation.serverId);
    const name = server?.name || installation.serverId;
    logger.item(name);

    // Show non-sensitive config
    for (const [key, value] of Object.entries(installation.config)) {
      if (
        key.toLowerCase().includes('token') ||
        key.toLowerCase().includes('key') ||
        key.toLowerCase().includes('secret')
      ) {
        logger.keyValue(key, '***', 1);
      } else {
        logger.keyValue(key, String(value), 1);
      }
    }
  }
}

/**
 * Confirm MCP configuration
 */
export async function confirmMcpConfig(config: McpConfig): Promise<boolean> {
  showMcpSummary(config);
  logger.newline();

  return confirm({
    message: 'Is this MCP configuration correct?',
    default: true,
  });
}

/**
 * Show post-install instructions for skipped MCP configurations
 * This should be called at the end of the installation process
 */
export function showSkippedMcpInstructions(
  skippedConfigs: SkippedMcpConfig[],
  mcpLevel: 'user' | 'project'
): void {
  if (skippedConfigs.length === 0) {
    return;
  }

  logger.newline();
  logger.title('MCP Server Configuration Required');
  logger.newline();
  logger.info('Some MCP servers need additional configuration.');
  logger.info('Add the required values to complete the setup:');

  const configFile =
    mcpLevel === 'user'
      ? colors.primary('~/.claude/settings.json')
      : colors.primary('.claude/settings.local.json');

  logger.newline();
  logger.keyValue('Config file', configFile);

  for (const skipped of skippedConfigs) {
    logger.newline();
    logger.subtitle(skipped.serverName);

    if (skipped.installInstructions) {
      logger.info(skipped.installInstructions);
    }

    logger.newline();
    logger.info('Missing configuration:');

    for (const field of skipped.skippedFields) {
      const envInfo = field.envVar ? colors.muted(` (or set env: ${field.envVar})`) : '';
      logger.item(`${colors.warning(field.name)}: ${field.description}${envInfo}`);
    }

    // Show example JSON snippet
    logger.newline();
    logger.info('Add to mcpServers in your config file:');
    logger.raw(colors.muted('  {'));
    logger.raw(colors.muted(`    "${skipped.serverId}": {`));
    for (const field of skipped.skippedFields) {
      logger.raw(colors.muted(`      "${field.name}": "<your-${field.name}>",`));
    }
    logger.raw(colors.muted('    }'));
    logger.raw(colors.muted('  }'));
  }

  logger.newline();
  logger.info(
    colors.muted(
      'Tip: You can also use environment variables for sensitive values like tokens and keys.'
    )
  );
}
