/**
 * MCP server configuration prompts
 */

import { checkbox, confirm, input, password, select } from '@inquirer/prompts';
import { MCP_SERVERS, getMcpServer } from '../../constants/mcp-servers.js';
import { colors, logger } from '../../lib/utils/logger.js';
import type { McpConfig, McpInstallation } from '../../types/config.js';
import type { McpConfigField, McpServerDefinition } from '../../types/mcp.js';

interface McpPromptOptions {
  defaults?: Partial<McpConfig>;
}

/**
 * Prompt for MCP configuration
 */
export async function promptMcpConfig(options?: McpPromptOptions): Promise<McpConfig> {
  logger.subtitle('MCP Server Configuration');

  const enableMcp = await confirm({
    message: 'Do you want to configure MCP servers?',
    default: true,
  });

  if (!enableMcp) {
    return {
      level: 'project',
      servers: [],
    };
  }

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
  logger.newline();

  // Show grouped selection
  for (const [category, servers] of Object.entries(serversByCategory)) {
    const choices = servers.map((s) => ({
      name: `${s.name} - ${s.description}`,
      value: s.id,
      checked: options?.defaults?.servers?.some((i) => i.serverId === s.id) ?? false,
    }));

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

  // Configure selected servers
  for (const serverId of selectedServerIds) {
    const server = getMcpServer(serverId);
    if (server) {
      const installation = await configureServer(server, level);
      installations.push(installation);
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
    level,
    servers: installations,
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
    'version-control': '🔄 Version Control',
    deployment: '🚀 Deployment',
    infrastructure: '🏗️  Infrastructure',
    'project-mgmt': '📋 Project Management',
    monitoring: '📊 Monitoring',
    custom: '⚙️  Custom',
  };
  return labels[category] || category;
}

/**
 * Configure a single MCP server
 */
async function configureServer(
  server: McpServerDefinition,
  level: 'user' | 'project'
): Promise<McpInstallation> {
  const config: Record<string, unknown> = {};

  if (server.requiresConfig && server.configFields) {
    logger.newline();
    logger.info(`Configuring ${colors.primary(server.name)}...`);

    for (const field of server.configFields) {
      const value = await promptConfigField(field);
      if (value !== undefined && value !== '') {
        config[field.name] = value;
      }
    }
  }

  return {
    serverId: server.id,
    level,
    config,
  };
}

/**
 * Prompt for a config field value
 */
async function promptConfigField(
  field: McpConfigField
): Promise<string | boolean | number | undefined> {
  const envHint = field.envVar ? colors.muted(` (env: ${field.envVar})`) : '';

  // Try to get from environment
  const envValue = field.envVar ? process.env[field.envVar] : undefined;

  if (field.type === 'boolean') {
    return confirm({
      message: `${field.description}${envHint}:`,
      default: (field.default as boolean) ?? false,
    });
  }

  if (field.type === 'number') {
    const value = await input({
      message: `${field.description}${envHint}:`,
      default: envValue || (field.default as string) || '',
      validate: (v) => {
        if (field.required && !v.trim()) return 'This field is required';
        if (v && Number.isNaN(Number(v))) return 'Please enter a valid number';
        return true;
      },
    });
    return value ? Number(value) : undefined;
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
      if (useEnv) return envValue;
    }

    return password({
      message: `${field.description}${envHint}:`,
      validate: (v) => {
        if (field.required && !v.trim()) return 'This field is required';
        return true;
      },
    });
  }

  return input({
    message: `${field.description}${envHint}:`,
    default: envValue || (field.default as string) || '',
    validate: (v) => {
      if (field.required && !v.trim()) return 'This field is required';
      return true;
    },
  });
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
