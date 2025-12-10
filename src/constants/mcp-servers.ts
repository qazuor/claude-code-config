/**
 * MCP Server definitions
 */

import type { McpServerDefinition } from '../types/mcp.js';

/**
 * Available MCP servers
 */
export const MCP_SERVERS: McpServerDefinition[] = [
  // ============================================
  // DOCUMENTATION
  // ============================================
  {
    id: 'context7',
    name: 'Context7',
    description: 'Documentation lookup for libraries and frameworks',
    package: '@anthropic/context7-mcp',
    category: 'documentation',
    requiresConfig: false,
  },

  // ============================================
  // TESTING & BROWSER AUTOMATION
  // ============================================
  {
    id: 'chrome-devtools',
    name: 'Chrome DevTools',
    description:
      'Browser automation, debugging, and performance profiling via Chrome DevTools Protocol',
    package: '@anthropic/chrome-devtools-mcp',
    category: 'testing',
    requiresConfig: false,
    installInstructions: 'Requires Chrome/Chromium browser installed on the system.',
  },
  {
    id: 'playwright',
    name: 'Playwright',
    description: 'Cross-browser end-to-end testing and automation',
    package: '@anthropic/playwright-mcp',
    category: 'testing',
    requiresConfig: false,
    installInstructions: 'Run `npx playwright install` after setup to install browsers.',
  },
  {
    id: 'puppeteer',
    name: 'Puppeteer',
    description: 'Headless Chrome automation for testing and scraping',
    package: '@anthropic/puppeteer-mcp',
    category: 'testing',
    requiresConfig: false,
  },

  // ============================================
  // VERSION CONTROL
  // ============================================
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
        required: false,
        description: 'GitHub Personal Access Token',
        envVar: 'GITHUB_TOKEN',
      },
    ],
    installInstructions:
      'Create a Personal Access Token at https://github.com/settings/tokens with repo, issues, and pull_request scopes.',
  },
  {
    id: 'gitlab',
    name: 'GitLab',
    description: 'GitLab API integration (issues, MRs, repos)',
    package: '@anthropic/gitlab-mcp',
    category: 'version-control',
    requiresConfig: true,
    configFields: [
      {
        name: 'token',
        type: 'string',
        required: false,
        description: 'GitLab Personal Access Token',
        envVar: 'GITLAB_TOKEN',
      },
      {
        name: 'baseUrl',
        type: 'string',
        required: false,
        description: 'GitLab instance URL (default: https://gitlab.com)',
        default: 'https://gitlab.com',
      },
    ],
    installInstructions:
      'Create a Personal Access Token at GitLab Settings > Access Tokens with api scope.',
  },

  // ============================================
  // DATABASES
  // ============================================
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
        required: false,
        description: 'PostgreSQL connection string',
        envVar: 'DATABASE_URL',
      },
    ],
    installInstructions: 'Connection string format: postgresql://user:password@host:port/database',
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
        required: false,
        description: 'Neon API Key',
        envVar: 'NEON_API_KEY',
      },
    ],
    installInstructions: 'Get your API key from https://console.neon.tech/app/settings/api-keys',
  },
  {
    id: 'mongodb',
    name: 'MongoDB',
    description: 'MongoDB document database access',
    package: '@anthropic/mongodb-mcp',
    category: 'database',
    requiresConfig: true,
    configFields: [
      {
        name: 'connectionString',
        type: 'string',
        required: false,
        description: 'MongoDB connection string',
        envVar: 'MONGODB_URI',
      },
    ],
    installInstructions:
      'Connection string format: mongodb://user:password@host:port/database or mongodb+srv://...',
  },
  {
    id: 'mysql',
    name: 'MySQL',
    description: 'MySQL/MariaDB database access',
    package: '@anthropic/mysql-mcp',
    category: 'database',
    requiresConfig: true,
    configFields: [
      {
        name: 'connectionString',
        type: 'string',
        required: false,
        description: 'MySQL connection string',
        envVar: 'MYSQL_URL',
      },
    ],
    installInstructions: 'Connection string format: mysql://user:password@host:port/database',
  },
  {
    id: 'sqlite',
    name: 'SQLite',
    description: 'SQLite local database access',
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
    description: 'Supabase backend-as-a-service (DB, Auth, Storage)',
    package: '@supabase/mcp-server',
    category: 'database',
    requiresConfig: true,
    configFields: [
      {
        name: 'url',
        type: 'string',
        required: false,
        description: 'Supabase project URL',
        envVar: 'SUPABASE_URL',
      },
      {
        name: 'anonKey',
        type: 'string',
        required: false,
        description: 'Supabase anon/public key',
        envVar: 'SUPABASE_ANON_KEY',
      },
    ],
    installInstructions:
      'Find your project URL and anon key in Supabase Dashboard > Settings > API',
  },

  // ============================================
  // CACHE & KEY-VALUE STORES
  // ============================================
  {
    id: 'redis',
    name: 'Redis',
    description: 'Redis cache and key-value store',
    package: '@anthropic/redis-mcp',
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
    installInstructions: 'Connection URL format: redis://[[user]:password@]host[:port][/db]',
  },
  {
    id: 'upstash',
    name: 'Upstash',
    description: 'Upstash serverless Redis and Kafka',
    package: '@upstash/mcp-server',
    category: 'cache',
    requiresConfig: true,
    configFields: [
      {
        name: 'url',
        type: 'string',
        required: false,
        description: 'Upstash Redis REST URL',
        envVar: 'UPSTASH_REDIS_REST_URL',
      },
      {
        name: 'token',
        type: 'string',
        required: false,
        description: 'Upstash Redis REST token',
        envVar: 'UPSTASH_REDIS_REST_TOKEN',
      },
    ],
    installInstructions: 'Get credentials from https://console.upstash.com',
  },

  // ============================================
  // DEPLOYMENT & INFRASTRUCTURE
  // ============================================
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
        required: false,
        description: 'Vercel Access Token',
        envVar: 'VERCEL_TOKEN',
      },
    ],
    installInstructions: 'Create an access token at https://vercel.com/account/tokens',
  },
  {
    id: 'netlify',
    name: 'Netlify',
    description: 'Netlify deployment and site management',
    package: '@anthropic/netlify-mcp',
    category: 'deployment',
    requiresConfig: true,
    configFields: [
      {
        name: 'token',
        type: 'string',
        required: false,
        description: 'Netlify Personal Access Token',
        envVar: 'NETLIFY_TOKEN',
      },
    ],
    installInstructions:
      'Create a token at https://app.netlify.com/user/applications#personal-access-tokens',
  },
  {
    id: 'cloudflare',
    name: 'Cloudflare',
    description: 'Cloudflare Workers, Pages, and DNS management',
    package: '@cloudflare/mcp-server',
    category: 'deployment',
    requiresConfig: true,
    configFields: [
      {
        name: 'apiToken',
        type: 'string',
        required: false,
        description: 'Cloudflare API Token',
        envVar: 'CLOUDFLARE_API_TOKEN',
      },
      {
        name: 'accountId',
        type: 'string',
        required: false,
        description: 'Cloudflare Account ID',
        envVar: 'CLOUDFLARE_ACCOUNT_ID',
      },
    ],
    installInstructions: 'Create an API token at https://dash.cloudflare.com/profile/api-tokens',
  },
  {
    id: 'aws',
    name: 'AWS',
    description: 'Amazon Web Services integration',
    package: '@anthropic/aws-mcp',
    category: 'infrastructure',
    requiresConfig: true,
    configFields: [
      {
        name: 'accessKeyId',
        type: 'string',
        required: false,
        description: 'AWS Access Key ID',
        envVar: 'AWS_ACCESS_KEY_ID',
      },
      {
        name: 'secretAccessKey',
        type: 'string',
        required: false,
        description: 'AWS Secret Access Key',
        envVar: 'AWS_SECRET_ACCESS_KEY',
      },
      {
        name: 'region',
        type: 'string',
        required: false,
        description: 'AWS Region',
        envVar: 'AWS_REGION',
        default: 'us-east-1',
      },
    ],
    installInstructions: 'Create credentials in AWS IAM Console with appropriate permissions.',
  },
  {
    id: 'docker',
    name: 'Docker',
    description: 'Docker container management',
    package: '@anthropic/docker-mcp',
    category: 'infrastructure',
    requiresConfig: false,
    installInstructions: 'Requires Docker Desktop or Docker Engine installed.',
  },
  {
    id: 'kubernetes',
    name: 'Kubernetes',
    description: 'Kubernetes cluster management',
    package: '@anthropic/kubernetes-mcp',
    category: 'infrastructure',
    requiresConfig: true,
    configFields: [
      {
        name: 'kubeconfig',
        type: 'string',
        required: false,
        description: 'Path to kubeconfig file',
        default: '~/.kube/config',
      },
      {
        name: 'context',
        type: 'string',
        required: false,
        description: 'Kubernetes context to use',
      },
    ],
    installInstructions: 'Requires kubectl installed and configured.',
  },
  {
    id: 'filesystem',
    name: 'Filesystem',
    description: 'Enhanced filesystem operations',
    package: '@modelcontextprotocol/server-filesystem',
    category: 'infrastructure',
    requiresConfig: false,
  },

  // ============================================
  // PROJECT MANAGEMENT
  // ============================================
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
        required: false,
        description: 'Linear API Key',
        envVar: 'LINEAR_API_KEY',
      },
    ],
    installInstructions: 'Create an API key at https://linear.app/settings/api',
  },
  {
    id: 'jira',
    name: 'Jira',
    description: 'Atlassian Jira issue tracking',
    package: '@anthropic/jira-mcp',
    category: 'project-mgmt',
    requiresConfig: true,
    configFields: [
      {
        name: 'host',
        type: 'string',
        required: false,
        description: 'Jira instance URL',
        envVar: 'JIRA_HOST',
      },
      {
        name: 'email',
        type: 'string',
        required: false,
        description: 'Jira account email',
        envVar: 'JIRA_EMAIL',
      },
      {
        name: 'token',
        type: 'string',
        required: false,
        description: 'Jira API Token',
        envVar: 'JIRA_TOKEN',
      },
    ],
    installInstructions:
      'Create an API token at https://id.atlassian.com/manage-profile/security/api-tokens',
  },
  {
    id: 'notion',
    name: 'Notion',
    description: 'Notion workspace, pages, and databases',
    package: '@anthropic/notion-mcp',
    category: 'project-mgmt',
    requiresConfig: true,
    configFields: [
      {
        name: 'token',
        type: 'string',
        required: false,
        description: 'Notion Integration Token',
        envVar: 'NOTION_TOKEN',
      },
    ],
    installInstructions:
      'Create an integration at https://www.notion.so/my-integrations and share pages with it.',
  },
  {
    id: 'asana',
    name: 'Asana',
    description: 'Asana project and task management',
    package: '@anthropic/asana-mcp',
    category: 'project-mgmt',
    requiresConfig: true,
    configFields: [
      {
        name: 'token',
        type: 'string',
        required: false,
        description: 'Asana Personal Access Token',
        envVar: 'ASANA_TOKEN',
      },
    ],
    installInstructions: 'Create a PAT at https://app.asana.com/0/my-apps',
  },

  // ============================================
  // MONITORING & OBSERVABILITY
  // ============================================
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
        required: false,
        description: 'Sentry Auth Token',
        envVar: 'SENTRY_AUTH_TOKEN',
      },
      {
        name: 'org',
        type: 'string',
        required: false,
        description: 'Sentry Organization slug',
      },
    ],
    installInstructions:
      'Create an auth token at https://sentry.io/settings/account/api/auth-tokens/',
  },
  {
    id: 'datadog',
    name: 'Datadog',
    description: 'Datadog monitoring and APM',
    package: '@anthropic/datadog-mcp',
    category: 'monitoring',
    requiresConfig: true,
    configFields: [
      {
        name: 'apiKey',
        type: 'string',
        required: false,
        description: 'Datadog API Key',
        envVar: 'DD_API_KEY',
      },
      {
        name: 'appKey',
        type: 'string',
        required: false,
        description: 'Datadog Application Key',
        envVar: 'DD_APP_KEY',
      },
      {
        name: 'site',
        type: 'string',
        required: false,
        description: 'Datadog site (e.g., datadoghq.com)',
        default: 'datadoghq.com',
      },
    ],
    installInstructions: 'Find keys at https://app.datadoghq.com/organization-settings/api-keys',
  },

  // ============================================
  // COMMUNICATION
  // ============================================
  {
    id: 'slack',
    name: 'Slack',
    description: 'Slack messaging and channel management',
    package: '@anthropic/slack-mcp',
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
  {
    id: 'discord',
    name: 'Discord',
    description: 'Discord bot and server management',
    package: '@anthropic/discord-mcp',
    category: 'communication',
    requiresConfig: true,
    configFields: [
      {
        name: 'token',
        type: 'string',
        required: false,
        description: 'Discord Bot Token',
        envVar: 'DISCORD_BOT_TOKEN',
      },
    ],
    installInstructions: 'Create a bot at https://discord.com/developers/applications',
  },

  // ============================================
  // DESIGN
  // ============================================
  {
    id: 'figma',
    name: 'Figma',
    description: 'Figma design file access and inspection',
    package: '@anthropic/figma-mcp',
    category: 'design',
    requiresConfig: true,
    configFields: [
      {
        name: 'token',
        type: 'string',
        required: false,
        description: 'Figma Personal Access Token',
        envVar: 'FIGMA_TOKEN',
      },
    ],
    installInstructions: 'Create a token at https://www.figma.com/developers/api#access-tokens',
  },

  // ============================================
  // PAYMENTS
  // ============================================
  {
    id: 'stripe',
    name: 'Stripe',
    description: 'Stripe payments API integration',
    package: '@stripe/mcp-server',
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
      'Find your API keys at https://dashboard.stripe.com/apikeys (use test keys for development)',
  },

  // ============================================
  // SEARCH
  // ============================================
  {
    id: 'algolia',
    name: 'Algolia',
    description: 'Algolia search and discovery',
    package: '@anthropic/algolia-mcp',
    category: 'search',
    requiresConfig: true,
    configFields: [
      {
        name: 'appId',
        type: 'string',
        required: false,
        description: 'Algolia Application ID',
        envVar: 'ALGOLIA_APP_ID',
      },
      {
        name: 'apiKey',
        type: 'string',
        required: false,
        description: 'Algolia Admin API Key',
        envVar: 'ALGOLIA_API_KEY',
      },
    ],
    installInstructions: 'Find credentials at https://www.algolia.com/account/api-keys/',
  },
  {
    id: 'elasticsearch',
    name: 'Elasticsearch',
    description: 'Elasticsearch search engine',
    package: '@anthropic/elasticsearch-mcp',
    category: 'search',
    requiresConfig: true,
    configFields: [
      {
        name: 'node',
        type: 'string',
        required: false,
        description: 'Elasticsearch node URL',
        envVar: 'ELASTICSEARCH_NODE',
        default: 'http://localhost:9200',
      },
      {
        name: 'apiKey',
        type: 'string',
        required: false,
        description: 'Elasticsearch API Key (optional)',
        envVar: 'ELASTICSEARCH_API_KEY',
      },
    ],
  },

  // ============================================
  // AI & ML
  // ============================================
  {
    id: 'openai',
    name: 'OpenAI',
    description: 'OpenAI API for GPT and embeddings',
    package: '@anthropic/openai-mcp',
    category: 'ai',
    requiresConfig: true,
    configFields: [
      {
        name: 'apiKey',
        type: 'string',
        required: false,
        description: 'OpenAI API Key',
        envVar: 'OPENAI_API_KEY',
      },
    ],
    installInstructions: 'Get your API key at https://platform.openai.com/api-keys',
  },
  {
    id: 'pinecone',
    name: 'Pinecone',
    description: 'Pinecone vector database for embeddings',
    package: '@anthropic/pinecone-mcp',
    category: 'ai',
    requiresConfig: true,
    configFields: [
      {
        name: 'apiKey',
        type: 'string',
        required: false,
        description: 'Pinecone API Key',
        envVar: 'PINECONE_API_KEY',
      },
      {
        name: 'environment',
        type: 'string',
        required: false,
        description: 'Pinecone environment',
        envVar: 'PINECONE_ENVIRONMENT',
      },
    ],
    installInstructions: 'Get credentials at https://app.pinecone.io/',
  },

  // ============================================
  // SECURITY
  // ============================================
  {
    id: 'vault',
    name: 'HashiCorp Vault',
    description: 'Secrets management with HashiCorp Vault',
    package: '@anthropic/vault-mcp',
    category: 'security',
    requiresConfig: true,
    configFields: [
      {
        name: 'address',
        type: 'string',
        required: false,
        description: 'Vault server address',
        envVar: 'VAULT_ADDR',
        default: 'http://127.0.0.1:8200',
      },
      {
        name: 'token',
        type: 'string',
        required: false,
        description: 'Vault token',
        envVar: 'VAULT_TOKEN',
      },
    ],
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
