/**
 * MCP Server definitions
 * Only includes verified, real npm packages
 */

import type { McpServerDefinition } from '../types/mcp.js';

/**
 * Available MCP servers - all packages verified to exist on npm
 */
export const MCP_SERVERS: McpServerDefinition[] = [
  // ============================================
  // DOCUMENTATION & AI TOOLS
  // ============================================
  {
    id: 'context7',
    name: 'Context7',
    description: 'Up-to-date documentation lookup for libraries and frameworks',
    package: '@upstash/context7-mcp',
    category: 'documentation',
    requiresConfig: false,
    installInstructions:
      'API keys provide higher rate limits. Get one at https://context7.com/dashboard',
  },
  {
    id: 'perplexity',
    name: 'Perplexity',
    description: 'Web search without leaving the MCP ecosystem via Sonar API',
    package: '@chatmcp/server-perplexity-ask',
    category: 'search',
    requiresConfig: true,
    configFields: [
      {
        name: 'apiKey',
        type: 'string',
        required: true,
        description: 'Perplexity/Sonar API Key',
        envVar: 'PERPLEXITY_API_KEY',
      },
    ],
    installInstructions: 'Get API key at https://www.perplexity.ai/settings/api',
  },
  {
    id: 'sequential-thinking',
    name: 'Sequential Thinking',
    description: 'Dynamic problem-solving through structured thinking process',
    package: '@modelcontextprotocol/server-sequential-thinking',
    category: 'ai',
    requiresConfig: false,
    installInstructions: 'Helps break down complex problems into manageable steps.',
  },

  // ============================================
  // TESTING & BROWSER AUTOMATION
  // ============================================
  {
    id: 'puppeteer',
    name: 'Puppeteer',
    description: 'Headless Chrome automation for testing and scraping',
    package: '@modelcontextprotocol/server-puppeteer',
    category: 'testing',
    requiresConfig: false,
  },
  {
    id: 'playwright',
    name: 'Playwright',
    description: 'Browser automation via accessibility snapshots, not screenshots',
    package: '@playwright/mcp',
    category: 'testing',
    requiresConfig: false,
    installInstructions: 'Requires Node.js 18+. Supports Chrome, Firefox, WebKit.',
  },
  {
    id: 'chrome-devtools',
    name: 'Chrome DevTools',
    description: 'Control and inspect live Chrome browser with DevTools Protocol',
    package: 'chrome-devtools-mcp',
    category: 'testing',
    requiresConfig: false,
    installInstructions:
      'Requires Chrome installed. For Claude Code: claude mcp add chrome-devtools npx chrome-devtools-mcp@latest',
  },

  // ============================================
  // VERSION CONTROL
  // ============================================
  {
    id: 'github',
    name: 'GitHub',
    description: 'GitHub API integration (issues, PRs, repos, file operations)',
    package: '@modelcontextprotocol/server-github',
    category: 'version-control',
    requiresConfig: true,
    configFields: [
      {
        name: 'token',
        type: 'string',
        required: false,
        description: 'GitHub Personal Access Token',
        envVar: 'GITHUB_TOKEN',
      },
    ],
    installInstructions:
      'Create a Personal Access Token at https://github.com/settings/tokens with repo scope.',
  },
  {
    id: 'gitlab',
    name: 'GitLab',
    description: 'GitLab API for project management, issues, and merge requests',
    package: '@modelcontextprotocol/server-gitlab',
    category: 'version-control',
    requiresConfig: true,
    configFields: [
      {
        name: 'token',
        type: 'string',
        required: true,
        description: 'GitLab Personal Access Token',
        envVar: 'GITLAB_PERSONAL_ACCESS_TOKEN',
      },
      {
        name: 'apiUrl',
        type: 'string',
        required: false,
        description: 'GitLab API URL (default: https://gitlab.com/api/v4)',
        envVar: 'GITLAB_API_URL',
        default: 'https://gitlab.com/api/v4',
      },
    ],
    installInstructions:
      'Create PAT at GitLab User Settings > Access Tokens with api, read_repository, write_repository scopes.',
  },

  // ============================================
  // DATABASES
  // ============================================
  {
    id: 'postgres',
    name: 'PostgreSQL',
    description: 'Read-only PostgreSQL database access with schema inspection',
    package: '@modelcontextprotocol/server-postgres',
    category: 'database',
    requiresConfig: true,
    configFields: [
      {
        name: 'connectionString',
        type: 'string',
        required: false,
        description: 'PostgreSQL connection string',
        envVar: 'DATABASE_URL',
      },
    ],
    installInstructions: 'Connection string format: postgresql://user:password@host:port/database',
  },
  {
    id: 'mysql',
    name: 'MySQL',
    description: 'Read-only MySQL/MariaDB database access',
    package: '@modelcontextprotocol/server-mysql',
    category: 'database',
    requiresConfig: true,
    configFields: [
      {
        name: 'connectionString',
        type: 'string',
        required: true,
        description: 'MySQL connection URL',
        envVar: 'MYSQL_URL',
      },
    ],
    installInstructions: 'Connection format: mysql://user:password@host:port/database',
  },
  {
    id: 'neon',
    name: 'Neon',
    description: 'Neon serverless PostgreSQL with branch management',
    package: '@neondatabase/mcp-server-neon',
    category: 'database',
    requiresConfig: true,
    configFields: [
      {
        name: 'apiKey',
        type: 'string',
        required: false,
        description: 'Neon API Key',
        envVar: 'NEON_API_KEY',
      },
    ],
    installInstructions: 'Get your API key from https://console.neon.tech/app/settings/api-keys',
  },
  {
    id: 'sqlite',
    name: 'SQLite',
    description: 'SQLite database interaction and business intelligence',
    package: '@modelcontextprotocol/server-sqlite',
    category: 'database',
    requiresConfig: true,
    configFields: [
      {
        name: 'dbPath',
        type: 'string',
        required: false,
        description: 'Path to SQLite database file',
        default: './data.db',
      },
    ],
  },
  {
    id: 'supabase',
    name: 'Supabase',
    description: 'Supabase projects, database, Edge Functions, and type generation',
    package: '@supabase/mcp-server-supabase',
    category: 'database',
    requiresConfig: true,
    configFields: [
      {
        name: 'accessToken',
        type: 'string',
        required: false,
        description: 'Supabase Personal Access Token',
        envVar: 'SUPABASE_ACCESS_TOKEN',
      },
    ],
    installInstructions: 'Get your access token from https://supabase.com/dashboard/account/tokens',
  },

  // ============================================
  // CACHE & KEY-VALUE STORES
  // ============================================
  {
    id: 'redis',
    name: 'Redis',
    description: 'Redis key-value store operations (set, get, delete, list)',
    package: '@modelcontextprotocol/server-redis',
    category: 'cache',
    requiresConfig: true,
    configFields: [
      {
        name: 'url',
        type: 'string',
        required: false,
        description: 'Redis connection URL',
        envVar: 'REDIS_URL',
        default: 'redis://localhost:6379',
      },
    ],
    installInstructions:
      'Pass Redis URL as argument: npx @modelcontextprotocol/server-redis redis://localhost:6379',
  },
  {
    id: 'upstash',
    name: 'Upstash',
    description: 'Upstash Redis database management and commands',
    package: '@upstash/mcp-server',
    category: 'cache',
    requiresConfig: true,
    configFields: [
      {
        name: 'email',
        type: 'string',
        required: false,
        description: 'Upstash account email',
        envVar: 'UPSTASH_EMAIL',
      },
      {
        name: 'apiKey',
        type: 'string',
        required: false,
        description: 'Upstash API Key',
        envVar: 'UPSTASH_API_KEY',
      },
    ],
    installInstructions: 'Get credentials from https://console.upstash.com',
  },

  // ============================================
  // DEPLOYMENT & INFRASTRUCTURE
  // ============================================
  {
    id: 'cloudflare',
    name: 'Cloudflare',
    description: 'Cloudflare Workers, D1, KV, R2, and DNS management',
    package: '@cloudflare/mcp-server-cloudflare',
    category: 'deployment',
    requiresConfig: true,
    configFields: [
      {
        name: 'accountId',
        type: 'string',
        required: false,
        description: 'Cloudflare Account ID',
        envVar: 'CLOUDFLARE_ACCOUNT_ID',
      },
    ],
    installInstructions: 'Run: npx @cloudflare/mcp-server-cloudflare init',
  },
  {
    id: 'vercel',
    name: 'Vercel',
    description: 'Vercel deployments, DNS records, and project management',
    package: 'vercel-mcp',
    category: 'deployment',
    requiresConfig: true,
    configFields: [
      {
        name: 'apiKey',
        type: 'string',
        required: true,
        description: 'Vercel API Key',
        envVar: 'VERCEL_API_KEY',
      },
    ],
    installInstructions: 'Get API key at https://vercel.com/account/tokens',
  },
  {
    id: 'filesystem',
    name: 'Filesystem',
    description: 'Secure file operations with configurable access controls',
    package: '@modelcontextprotocol/server-filesystem',
    category: 'infrastructure',
    requiresConfig: false,
  },
  {
    id: 'memory',
    name: 'Memory',
    description: 'Knowledge graph-based persistent memory system',
    package: '@modelcontextprotocol/server-memory',
    category: 'infrastructure',
    requiresConfig: false,
    installInstructions: 'Memory is stored in memory.jsonl in the server directory by default.',
  },

  // ============================================
  // PROJECT MANAGEMENT & PRODUCTIVITY
  // ============================================
  {
    id: 'notion',
    name: 'Notion',
    description: 'Official Notion API for pages, databases, and workspace',
    package: '@notionhq/notion-mcp-server',
    category: 'project-mgmt',
    requiresConfig: true,
    configFields: [
      {
        name: 'token',
        type: 'string',
        required: true,
        description: 'Notion Integration Token',
        envVar: 'NOTION_TOKEN',
      },
    ],
    installInstructions:
      'Create integration at https://www.notion.so/profile/integrations and share pages with it.',
  },
  {
    id: 'obsidian',
    name: 'Obsidian',
    description: 'Read and search Obsidian vaults and Markdown directories',
    package: 'mcp-obsidian',
    category: 'project-mgmt',
    requiresConfig: true,
    configFields: [
      {
        name: 'vaultPath',
        type: 'string',
        required: true,
        description: 'Path to Obsidian vault',
      },
    ],
    installInstructions: 'Works with any Markdown directory. Point to your vault path.',
  },
  {
    id: 'n8n',
    name: 'n8n',
    description: 'n8n workflow automation node documentation and management',
    package: 'n8n-mcp',
    category: 'project-mgmt',
    requiresConfig: false,
    installInstructions: 'Provides access to 543 n8n nodes documentation.',
  },

  // ============================================
  // MONITORING & OBSERVABILITY
  // ============================================
  {
    id: 'sentry',
    name: 'Sentry',
    description: 'Query Sentry errors, issues, and project information',
    package: '@sentry/mcp-server',
    category: 'monitoring',
    requiresConfig: true,
    configFields: [
      {
        name: 'authToken',
        type: 'string',
        required: false,
        description: 'Sentry Auth Token',
        envVar: 'SENTRY_AUTH_TOKEN',
      },
    ],
    installInstructions:
      'For Claude Code: claude mcp add --transport http sentry https://mcp.sentry.dev/mcp',
  },

  // ============================================
  // COMMUNICATION
  // ============================================
  {
    id: 'slack',
    name: 'Slack',
    description: 'Slack messaging, channels, and workspace interaction',
    package: '@modelcontextprotocol/server-slack',
    category: 'communication',
    requiresConfig: true,
    configFields: [
      {
        name: 'token',
        type: 'string',
        required: false,
        description: 'Slack Bot Token (xoxb-...)',
        envVar: 'SLACK_BOT_TOKEN',
      },
    ],
    installInstructions:
      'Create a Slack app at https://api.slack.com/apps and install to your workspace.',
  },

  // ============================================
  // DESIGN
  // ============================================
  {
    id: 'figma',
    name: 'Figma',
    description: 'Figma layout information for AI coding agents',
    package: 'figma-developer-mcp',
    category: 'design',
    requiresConfig: true,
    configFields: [
      {
        name: 'apiKey',
        type: 'string',
        required: true,
        description: 'Figma Personal Access Token',
        envVar: 'FIGMA_API_KEY',
      },
    ],
    installInstructions: 'Create token at https://www.figma.com/developers/api#access-tokens',
  },
  {
    id: 'shadcn',
    name: 'shadcn/ui',
    description: 'shadcn/ui component docs, installation, and code generation',
    package: '@heilgar/shadcn-ui-mcp-server',
    category: 'ui-library',
    requiresConfig: false,
    installInstructions: 'Supports npm, pnpm, yarn, and bun package managers.',
  },
  {
    id: 'magic-ui',
    name: '21st.dev Magic',
    description: 'AI-driven UI component generation through natural language',
    package: '@21st-dev/magic',
    category: 'ui-library',
    requiresConfig: true,
    configFields: [
      {
        name: 'apiKey',
        type: 'string',
        required: true,
        description: '21st.dev Magic API Key',
        envVar: 'TWENTYFIRST_API_KEY',
      },
    ],
    installInstructions: 'Get API key at https://21st.dev/magic/console',
  },

  // ============================================
  // PAYMENTS
  // ============================================
  {
    id: 'stripe',
    name: 'Stripe',
    description: 'Stripe payments API with MCP support via Agent Toolkit',
    package: '@stripe/agent-toolkit',
    category: 'payments',
    requiresConfig: true,
    configFields: [
      {
        name: 'secretKey',
        type: 'string',
        required: false,
        description: 'Stripe Secret Key',
        envVar: 'STRIPE_SECRET_KEY',
      },
    ],
    installInstructions:
      'Get API keys at https://dashboard.stripe.com/apikeys. Run: npx -y @stripe/mcp --tools=all --api-key=YOUR_KEY',
  },
  {
    id: 'mercadopago',
    name: 'Mercado Pago',
    description: 'Mercado Pago payments, refunds, and customer management',
    package: 'mercado-pago-mcp',
    category: 'payments',
    requiresConfig: true,
    configFields: [
      {
        name: 'accessToken',
        type: 'string',
        required: true,
        description: 'Mercado Pago Access Token',
        envVar: 'MERCADOPAGO_ACCESS_TOKEN',
      },
      {
        name: 'environment',
        type: 'string',
        required: false,
        description: 'Environment (sandbox or production)',
        default: 'sandbox',
      },
    ],
    installInstructions: 'Get credentials at https://www.mercadopago.com/developers/panel/app',
  },

  // ============================================
  // SEARCH
  // ============================================
  {
    id: 'brave-search',
    name: 'Brave Search',
    description: 'Web and local search using Brave Search API',
    package: '@modelcontextprotocol/server-brave-search',
    category: 'search',
    requiresConfig: true,
    configFields: [
      {
        name: 'apiKey',
        type: 'string',
        required: false,
        description: 'Brave Search API Key',
        envVar: 'BRAVE_API_KEY',
      },
    ],
    installInstructions: 'Get an API key at https://brave.com/search/api/',
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
