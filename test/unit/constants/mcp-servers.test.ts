/**
 * Tests for MCP servers constants
 */
import { describe, expect, it } from 'vitest';
import {
  MCP_SERVERS,
  getMcpServer,
  getMcpServerIds,
  getMcpServersByCategory,
} from '../../../src/constants/mcp-servers.js';

describe('MCP_SERVERS', () => {
  it('should have at least 5 servers defined', () => {
    expect(MCP_SERVERS.length).toBeGreaterThanOrEqual(5);
  });

  it('each server should have required properties', () => {
    for (const server of MCP_SERVERS) {
      expect(server.id).toBeDefined();
      expect(typeof server.id).toBe('string');
      expect(server.id.length).toBeGreaterThan(0);

      expect(server.name).toBeDefined();
      expect(typeof server.name).toBe('string');

      expect(server.description).toBeDefined();
      expect(typeof server.description).toBe('string');

      expect(server.package).toBeDefined();
      expect(typeof server.package).toBe('string');

      expect(server.category).toBeDefined();
      expect(typeof server.category).toBe('string');

      expect(typeof server.requiresConfig).toBe('boolean');
    }
  });

  describe('server IDs', () => {
    it('should all be unique', () => {
      const ids = MCP_SERVERS.map((s) => s.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should follow kebab-case naming', () => {
      for (const server of MCP_SERVERS) {
        expect(server.id).toMatch(/^[a-z][a-z0-9-]*$/);
      }
    });
  });

  describe('servers requiring config', () => {
    it('should have configFields when requiresConfig is true', () => {
      const serversRequiringConfig = MCP_SERVERS.filter((s) => s.requiresConfig);

      for (const server of serversRequiringConfig) {
        expect(server.configFields).toBeDefined();
        expect(server.configFields?.length).toBeGreaterThan(0);
      }
    });

    it('configFields should have valid structure', () => {
      const serversRequiringConfig = MCP_SERVERS.filter((s) => s.requiresConfig);

      for (const server of serversRequiringConfig) {
        if (!server.configFields) continue;
        for (const field of server.configFields) {
          expect(field.name).toBeDefined();
          expect(typeof field.name).toBe('string');
          expect(field.type).toMatch(/^(string|boolean|number)$/);
          expect(typeof field.required).toBe('boolean');
          expect(field.description).toBeDefined();
        }
      }
    });
  });

  describe('known servers', () => {
    it('should include context7', () => {
      const context7 = MCP_SERVERS.find((s) => s.id === 'context7');
      expect(context7).toBeDefined();
      expect(context7?.category).toBe('documentation');
      expect(context7?.requiresConfig).toBe(false);
    });

    it('should include github', () => {
      const github = MCP_SERVERS.find((s) => s.id === 'github');
      expect(github).toBeDefined();
      expect(github?.category).toBe('version-control');
      expect(github?.requiresConfig).toBe(true);
      expect(github?.configFields?.some((f) => f.name === 'token')).toBe(true);
    });

    it('should include postgres', () => {
      const postgres = MCP_SERVERS.find((s) => s.id === 'postgres');
      expect(postgres).toBeDefined();
      expect(postgres?.category).toBe('database');
      expect(postgres?.requiresConfig).toBe(true);
    });

    it('should include vercel', () => {
      const vercel = MCP_SERVERS.find((s) => s.id === 'vercel');
      expect(vercel).toBeDefined();
      expect(vercel?.category).toBe('deployment');
    });
  });
});

describe('getMcpServer', () => {
  it('should return server by id', () => {
    const server = getMcpServer('context7');
    expect(server).toBeDefined();
    expect(server?.id).toBe('context7');
    expect(server?.name).toBe('Context7');
  });

  it('should return undefined for unknown id', () => {
    const server = getMcpServer('unknown-server');
    expect(server).toBeUndefined();
  });
});

describe('getMcpServersByCategory', () => {
  it('should return servers for documentation category', () => {
    const docs = getMcpServersByCategory('documentation');
    expect(docs.length).toBeGreaterThan(0);
    expect(docs.every((s) => s.category === 'documentation')).toBe(true);
  });

  it('should return servers for database category', () => {
    const dbs = getMcpServersByCategory('database');
    expect(dbs.length).toBeGreaterThan(0);
    expect(dbs.every((s) => s.category === 'database')).toBe(true);
  });

  it('should return empty array for custom category', () => {
    const custom = getMcpServersByCategory('custom');
    expect(custom).toEqual([]);
  });

  it('should return servers for infrastructure category', () => {
    const infra = getMcpServersByCategory('infrastructure');
    expect(infra.length).toBeGreaterThan(0);
    expect(infra.every((s) => s.category === 'infrastructure')).toBe(true);
  });
});

describe('getMcpServerIds', () => {
  it('should return all server ids', () => {
    const ids = getMcpServerIds();
    expect(ids.length).toBe(MCP_SERVERS.length);
    expect(ids).toContain('context7');
    expect(ids).toContain('github');
    expect(ids).toContain('postgres');
  });
});
