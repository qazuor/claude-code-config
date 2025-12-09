/**
 * MCP Server definitions
 */

import type { McpServerDefinition } from '../types/mcp.js';

/**
 * Available MCP servers
 */
export const MCP_SERVERS: McpServerDefinition[] = [
  {
    id: 'context7',
    name: 'Context7',
    description: 'Documentation lookup for libraries and frameworks',
    package: '@anthropic/context7-mcp',
    category: 'documentation',
    requiresConfig: false,
  },
  {
    id: 'github',
    name: 'GitHub',
    description: 'GitHub API integration (issues, PRs, repos)',
    package: '@modelcontextprotocol/server-github',
    category: 'version-control',
    requiresConfig: true,
    configFields: [
      {
        name: 'token',
        type: 'string',
        required: true,
        description: 'GitHub Personal Access Token',
        envVar: 'GITHUB_TOKEN',
      },
    ],
  },
  {
    id: 'postgres',
    name: 'PostgreSQL',
    description: 'Direct PostgreSQL database access',
    package: '@modelcontextprotocol/server-postgres',
    category: 'database',
    requiresConfig: true,
    configFields: [
      {
        name: 'connectionString',
        type: 'string',
        required: true,
        description: 'PostgreSQL connection string',
        envVar: 'DATABASE_URL',
      },
    ],
  },
  {
    id: 'neon',
    name: 'Neon',
    description: 'Neon serverless PostgreSQL',
    package: '@neondatabase/mcp-server-neon',
    category: 'database',
    requiresConfig: true,
    configFields: [
      {
        name: 'apiKey',
        type: 'string',
        required: true,
        description: 'Neon API Key',
        envVar: 'NEON_API_KEY',
      },
    ],
  },
  {
    id: 'vercel',
    name: 'Vercel',
    description: 'Vercel deployment and project management',
    package: '@vercel/mcp',
    category: 'deployment',
    requiresConfig: true,
    configFields: [
      {
        name: 'token',
        type: 'string',
        required: true,
        description: 'Vercel Access Token',
        envVar: 'VERCEL_TOKEN',
      },
    ],
  },
  {
    id: 'docker',
    name: 'Docker',
    description: 'Docker container management',
    package: '@anthropic/docker-mcp',
    category: 'infrastructure',
    requiresConfig: false,
  },
  {
    id: 'linear',
    name: 'Linear',
    description: 'Linear project management integration',
    package: '@anthropic/linear-mcp',
    category: 'project-mgmt',
    requiresConfig: true,
    configFields: [
      {
        name: 'apiKey',
        type: 'string',
        required: true,
        description: 'Linear API Key',
        envVar: 'LINEAR_API_KEY',
      },
    ],
  },
  {
    id: 'sentry',
    name: 'Sentry',
    description: 'Error monitoring and tracking',
    package: '@sentry/mcp-server',
    category: 'monitoring',
    requiresConfig: true,
    configFields: [
      {
        name: 'authToken',
        type: 'string',
        required: true,
        description: 'Sentry Auth Token',
        envVar: 'SENTRY_AUTH_TOKEN',
      },
      {
        name: 'org',
        type: 'string',
        required: true,
        description: 'Sentry Organization slug',
      },
    ],
  },
  {
    id: 'filesystem',
    name: 'Filesystem',
    description: 'Enhanced filesystem operations',
    package: '@modelcontextprotocol/server-filesystem',
    category: 'infrastructure',
    requiresConfig: false,
  },
];

/**
 * Get MCP server by ID
 */
export function getMcpServer(id: string): McpServerDefinition | undefined {
  return MCP_SERVERS.find((s) => s.id === id);
}

/**
 * Get MCP servers by category
 */
export function getMcpServersByCategory(
  category: McpServerDefinition['category']
): McpServerDefinition[] {
  return MCP_SERVERS.filter((s) => s.category === category);
}

/**
 * Get all MCP server IDs
 */
export function getMcpServerIds(): string[] {
  return MCP_SERVERS.map((s) => s.id);
}
