/**
 * MCP (Model Context Protocol) server types
 */

/**
 * MCP server categories
 */
export type McpCategory =
  | 'documentation'
  | 'database'
  | 'version-control'
  | 'deployment'
  | 'infrastructure'
  | 'project-mgmt'
  | 'monitoring'
  | 'custom';

/**
 * Configuration field for MCP servers that require setup
 */
export interface McpConfigField {
  /** Field name */
  name: string;
  /** Field type */
  type: 'string' | 'boolean' | 'number';
  /** Whether this field is required */
  required: boolean;
  /** Description for user prompt */
  description: string;
  /** Environment variable to read from (optional) */
  envVar?: string;
  /** Default value (optional) */
  default?: string | boolean | number;
}

/**
 * MCP server definition
 */
export interface McpServerDefinition {
  /** Unique server identifier */
  id: string;
  /** Display name */
  name: string;
  /** Description of what this server provides */
  description: string;
  /** npm package or command to run */
  package: string;
  /** Server category */
  category: McpCategory;
  /** Whether this server requires configuration */
  requiresConfig: boolean;
  /** Configuration fields (if requiresConfig is true) */
  configFields?: McpConfigField[];
  /** Installation instructions (optional) */
  installInstructions?: string;
}

/**
 * MCP server installation record
 */
export interface McpInstallation {
  /** Server ID from definition */
  serverId: string;
  /** Installation level */
  level: 'user' | 'project';
  /** Configuration values */
  config: Record<string, unknown>;
}

/**
 * MCP selection result from prompts
 */
export interface McpSelectionResult {
  /** Installation level */
  level: 'user' | 'project';
  /** Selected server IDs */
  servers: string[];
  /** Custom servers to add */
  customServers: McpServerDefinition[];
}
