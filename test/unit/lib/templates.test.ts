/**
 * Template processing tests
 */

import { describe, expect, it } from 'vitest';
import {
  applyTemplateTransform,
  buildTemplateContext,
  evaluateCondition,
  extendContext,
  findVariables,
  getContextValue,
  getIterable,
  hasAllModules,
  hasAnyModule,
  hasDirectives,
  hasModule,
  isTruthy,
  parseDirectives,
  parseExpression,
  parseVariable,
  processTemplate,
  validateTemplate,
} from '../../../src/lib/templates/index.js';
import type { ClaudeConfig } from '../../../src/types/config.js';
import type { TemplateContext } from '../../../src/types/templates.js';

describe('template parser', () => {
  describe('parseDirectives', () => {
    it('should parse if directive', () => {
      const content = '{{#if project.name}}Hello{{/if}}';
      const directives = parseDirectives(content);

      expect(directives).toHaveLength(1);
      expect(directives[0].type).toBe('if');
      expect(directives[0].expression).toBe('project.name');
      expect(directives[0].content).toBe('Hello');
    });

    it('should parse unless directive', () => {
      const content = '{{#unless modules.agents}}No agents{{/unless}}';
      const directives = parseDirectives(content);

      expect(directives).toHaveLength(1);
      expect(directives[0].type).toBe('unless');
      expect(directives[0].expression).toBe('modules.agents');
    });

    it('should parse each directive', () => {
      const content = '{{#each modules.agents}}Item{{/each}}';
      const directives = parseDirectives(content);

      expect(directives).toHaveLength(1);
      expect(directives[0].type).toBe('each');
      expect(directives[0].expression).toBe('modules.agents');
    });

    it('should parse nested directives', () => {
      const content = '{{#if project.name}}{{#each modules.agents}}Item{{/each}}{{/if}}';
      const directives = parseDirectives(content);

      expect(directives).toHaveLength(1);
      expect(directives[0].nested).toHaveLength(1);
      expect(directives[0].nested?.[0].type).toBe('each');
    });

    it('should parse multiple directives', () => {
      const content = '{{#if a}}A{{/if}} {{#if b}}B{{/if}}';
      const directives = parseDirectives(content);

      expect(directives).toHaveLength(2);
    });
  });

  describe('parseExpression', () => {
    it('should parse simple variable', () => {
      const result = parseExpression('project.name');

      expect(result.variable).toBe('project.name');
      expect(result.path).toEqual(['project', 'name']);
    });

    it('should parse comparison operators', () => {
      const result = parseExpression('count == 5');

      expect(result.variable).toBe('count');
      expect(result.operator).toBe('==');
      expect(result.compareValue).toBe('5');
    });

    it('should parse negation', () => {
      const result = parseExpression('!enabled');

      expect(result.variable).toBe('enabled');
      expect(result.operator).toBe('!');
    });

    it('should parse string comparison', () => {
      const result = parseExpression('type == "admin"');

      expect(result.compareValue).toBe('admin');
    });
  });

  describe('parseVariable', () => {
    it('should parse simple variable', () => {
      const result = parseVariable('{{project.name}}');

      expect(result.variable).toBe('project.name');
      expect(result.transform).toBeUndefined();
    });

    it('should parse variable with transform', () => {
      const result = parseVariable('{{project.name | uppercase}}');

      expect(result.variable).toBe('project.name');
      expect(result.transform).toBe('uppercase');
    });
  });

  describe('findVariables', () => {
    it('should find all variables', () => {
      const content = 'Hello {{name}}, welcome to {{project}}!';
      const variables = findVariables(content);

      expect(variables).toHaveLength(2);
      expect(variables[0].variable).toBe('name');
      expect(variables[1].variable).toBe('project');
    });

    it('should skip directive syntax', () => {
      const content = '{{#if test}}{{name}}{{/if}}';
      const variables = findVariables(content);

      expect(variables).toHaveLength(1);
      expect(variables[0].variable).toBe('name');
    });
  });

  describe('hasDirectives', () => {
    it('should return true for content with directives', () => {
      expect(hasDirectives('{{#if test}}content{{/if}}')).toBe(true);
      expect(hasDirectives('{{variable}}')).toBe(true);
    });

    it('should return false for plain content', () => {
      expect(hasDirectives('Just plain text')).toBe(false);
      expect(hasDirectives('No { incomplete braces here')).toBe(false);
    });
  });

  describe('validateTemplate', () => {
    it('should pass valid templates', () => {
      const result = validateTemplate('{{#if test}}content{{/if}}');

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail on mismatched blocks', () => {
      const result = validateTemplate('{{#if test}}content');

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });
});

describe('template evaluator', () => {
  const mockContext: TemplateContext = {
    project: {
      name: 'Test Project',
      description: 'A test project',
      org: 'test-org',
    },
    modules: {
      agents: ['tech-lead', 'react-senior-dev'],
      skills: ['tdd-methodology'],
      commands: ['commit'],
      docs: [],
    },
    codeStyle: {
      formatter: 'biome',
      editorConfig: true,
    },
    techStack: {
      framework: 'react',
    },
    bundles: [],
    mcpServers: ['github', 'context7'],
    custom: {
      enabled: true,
      count: 5,
    },
  };

  describe('getContextValue', () => {
    it('should get nested values', () => {
      expect(getContextValue(mockContext, 'project.name')).toBe('Test Project');
      expect(getContextValue(mockContext, 'codeStyle.formatter')).toBe('biome');
    });

    it('should return undefined for missing values', () => {
      expect(getContextValue(mockContext, 'project.missing')).toBeUndefined();
      expect(getContextValue(mockContext, 'nonexistent.path')).toBeUndefined();
    });

    it('should get arrays', () => {
      expect(getContextValue(mockContext, 'modules.agents')).toEqual([
        'tech-lead',
        'react-senior-dev',
      ]);
    });

    it('should get custom values', () => {
      expect(getContextValue(mockContext, 'custom.enabled')).toBe(true);
      expect(getContextValue(mockContext, 'custom.count')).toBe(5);
    });
  });

  describe('evaluateCondition', () => {
    it('should evaluate truthy values', () => {
      expect(evaluateCondition('project.name', mockContext)).toBe(true);
      expect(evaluateCondition('custom.enabled', mockContext)).toBe(true);
    });

    it('should evaluate falsy values', () => {
      expect(evaluateCondition('project.missing', mockContext)).toBe(false);
      expect(evaluateCondition('modules.docs', mockContext)).toBe(false);
    });

    it('should evaluate negation', () => {
      expect(evaluateCondition('!project.name', mockContext)).toBe(false);
      expect(evaluateCondition('!project.missing', mockContext)).toBe(true);
    });

    it('should evaluate comparisons', () => {
      expect(evaluateCondition('custom.count == 5', mockContext)).toBe(true);
      expect(evaluateCondition('custom.count != 5', mockContext)).toBe(false);
      expect(evaluateCondition('codeStyle.formatter == "biome"', mockContext)).toBe(true);
    });

    it('should evaluate AND conditions', () => {
      expect(evaluateCondition('project.name && custom.enabled', mockContext)).toBe(true);
      expect(evaluateCondition('project.name && project.missing', mockContext)).toBe(false);
    });

    it('should evaluate OR conditions', () => {
      expect(evaluateCondition('project.name || project.missing', mockContext)).toBe(true);
      expect(evaluateCondition('project.missing || modules.docs', mockContext)).toBe(false);
    });
  });

  describe('isTruthy', () => {
    it('should return true for truthy values', () => {
      expect(isTruthy('hello')).toBe(true);
      expect(isTruthy(true)).toBe(true);
      expect(isTruthy(1)).toBe(true);
      expect(isTruthy(['a'])).toBe(true);
      expect(isTruthy({ a: 1 })).toBe(true);
    });

    it('should return false for falsy values', () => {
      expect(isTruthy('')).toBe(false);
      expect(isTruthy(false)).toBe(false);
      expect(isTruthy(0)).toBe(false);
      expect(isTruthy([])).toBe(false);
      expect(isTruthy({})).toBe(false);
      expect(isTruthy(null)).toBe(false);
      expect(isTruthy(undefined)).toBe(false);
    });
  });

  describe('getIterable', () => {
    it('should iterate over arrays', () => {
      const items = getIterable('modules.agents', mockContext);

      expect(items).toHaveLength(2);
      expect(items[0].item).toBe('tech-lead');
      expect(items[0].index).toBe(0);
    });

    it('should return empty for non-iterables', () => {
      const items = getIterable('project.name', mockContext);

      expect(items).toHaveLength(0);
    });

    it('should iterate over objects', () => {
      const items = getIterable('project', mockContext);

      expect(items.length).toBeGreaterThan(0);
      expect(items[0].key).toBeDefined();
    });
  });

  describe('applyTemplateTransform', () => {
    it('should transform to lowercase', () => {
      expect(applyTemplateTransform('HELLO', 'lowercase')).toBe('hello');
      expect(applyTemplateTransform('HELLO', 'lower')).toBe('hello');
    });

    it('should transform to uppercase', () => {
      expect(applyTemplateTransform('hello', 'uppercase')).toBe('HELLO');
      expect(applyTemplateTransform('hello', 'upper')).toBe('HELLO');
    });

    it('should transform to capitalize', () => {
      expect(applyTemplateTransform('hello world', 'capitalize')).toBe('Hello World');
      expect(applyTemplateTransform('hello world', 'title')).toBe('Hello World');
    });

    it('should transform to kebab case', () => {
      expect(applyTemplateTransform('Hello World', 'kebab')).toBe('hello-world');
    });

    it('should transform to snake case', () => {
      expect(applyTemplateTransform('Hello World', 'snake')).toBe('hello_world');
    });

    it('should transform to camel case', () => {
      expect(applyTemplateTransform('hello world', 'camel')).toBe('helloWorld');
    });

    it('should transform to pascal case', () => {
      expect(applyTemplateTransform('hello world', 'pascal')).toBe('HelloWorld');
    });

    it('should get count', () => {
      expect(applyTemplateTransform(['a', 'b', 'c'], 'count')).toBe('3');
      expect(applyTemplateTransform('hello', 'count')).toBe('5');
    });

    it('should join arrays', () => {
      expect(applyTemplateTransform(['a', 'b', 'c'], 'join')).toBe('a, b, c');
      expect(applyTemplateTransform(['a', 'b'], 'joinlines')).toBe('a\nb');
    });

    it('should create bullets', () => {
      expect(applyTemplateTransform(['a', 'b'], 'bullet')).toBe('- a\n- b');
    });

    it('should create numbered list', () => {
      expect(applyTemplateTransform(['a', 'b'], 'numbered')).toBe('1. a\n2. b');
    });
  });
});

describe('template processor', () => {
  const mockContext: TemplateContext = {
    project: {
      name: 'Test Project',
      description: 'A test project',
    },
    modules: {
      agents: ['tech-lead', 'react-dev'],
      skills: ['tdd'],
      commands: [],
      docs: [],
    },
    codeStyle: {
      formatter: 'biome',
    },
    techStack: {},
    bundles: [],
    mcpServers: [],
    custom: {
      feature: true,
    },
  };

  describe('processTemplate', () => {
    it('should process if directive - true condition', () => {
      const content = '{{#if project.name}}Hello {{project.name}}{{/if}}';
      const result = processTemplate(content, mockContext);

      expect(result.content).toBe('Hello Test Project');
      expect(result.modified).toBe(true);
    });

    it('should process if directive - false condition', () => {
      const content = '{{#if project.missing}}Hello{{/if}}';
      const result = processTemplate(content, mockContext);

      expect(result.content).toBe('');
      expect(result.modified).toBe(true);
    });

    it('should process unless directive', () => {
      const content = '{{#unless project.missing}}Shown{{/unless}}';
      const result = processTemplate(content, mockContext);

      expect(result.content).toBe('Shown');
    });

    it('should process each directive', () => {
      const content = '{{#each modules.agents}}{{item}}\n{{/each}}';
      const result = processTemplate(content, mockContext);

      expect(result.content).toContain('tech-lead');
      expect(result.content).toContain('react-dev');
    });

    it('should process variable replacements', () => {
      const content = 'Project: {{project.name}}';
      const result = processTemplate(content, mockContext);

      expect(result.content).toBe('Project: Test Project');
    });

    it('should process variable with transform', () => {
      const content = '{{project.name | uppercase}}';
      const result = processTemplate(content, mockContext);

      expect(result.content).toBe('TEST PROJECT');
    });

    it('should process nested directives', () => {
      const content = '{{#if project.name}}{{#each modules.agents}}{{item}} {{/each}}{{/if}}';
      const result = processTemplate(content, mockContext);

      expect(result.content).toContain('tech-lead');
      expect(result.content).toContain('react-dev');
    });

    it('should not modify content without directives', () => {
      const content = 'Just plain text here';
      const result = processTemplate(content, mockContext);

      expect(result.content).toBe('Just plain text here');
      expect(result.modified).toBe(false);
    });

    it('should warn on missing variables', () => {
      const content = '{{missing.variable}}';
      const result = processTemplate(content, mockContext);

      expect(result.warnings.length).toBeGreaterThan(0);
    });
  });
});

describe('template context', () => {
  describe('buildTemplateContext', () => {
    it('should build context from config', () => {
      const config: Partial<ClaudeConfig> = {
        version: '1.0.0',
        project: {
          name: 'Test Project',
          description: 'A test',
          org: 'test-org',
          repo: 'test-repo',
          entityType: 'item',
          entityTypePlural: 'items',
        },
        modules: {
          agents: { selected: ['tech-lead'], excluded: [] },
          skills: { selected: ['tdd-methodology'], excluded: [] },
          commands: { selected: [], excluded: [] },
          docs: { selected: [], excluded: [] },
        },
        extras: {
          schemas: false,
          scripts: false,
          hooks: { enabled: false },
          sessions: false,
          codeStyle: {
            enabled: true,
            editorconfig: true,
            commitlint: false,
            biome: true,
            prettier: false,
          },
        },
        mcp: {
          level: 'user',
          servers: [{ serverId: 'github', configuredAt: new Date().toISOString() }],
        },
      };

      const context = buildTemplateContext(config);

      expect(context.project.name).toBe('Test Project');
      expect(context.modules.agents).toContain('tech-lead');
      expect(context.codeStyle.formatter).toBe('biome');
      expect(context.mcpServers).toContain('github');
    });
  });

  describe('extendContext', () => {
    it('should merge context values', () => {
      const base: TemplateContext = {
        project: { name: 'Base' },
        modules: { agents: ['a'], skills: [], commands: [], docs: [] },
        codeStyle: {},
        techStack: {},
        bundles: [],
        mcpServers: [],
        custom: {},
      };

      const extended = extendContext(base, {
        project: { description: 'Extended' },
        custom: { key: 'value' },
      });

      expect(extended.project.name).toBe('Base');
      expect(extended.project.description).toBe('Extended');
      expect(extended.custom.key).toBe('value');
    });
  });

  describe('hasModule', () => {
    const context: TemplateContext = {
      project: {},
      modules: {
        agents: ['tech-lead'],
        skills: ['tdd'],
        commands: ['commit'],
        docs: ['readme'],
      },
      codeStyle: {},
      techStack: {},
      bundles: [],
      mcpServers: [],
      custom: {},
    };

    it('should find modules in any category', () => {
      expect(hasModule(context, 'tech-lead')).toBe(true);
      expect(hasModule(context, 'tdd')).toBe(true);
      expect(hasModule(context, 'commit')).toBe(true);
      expect(hasModule(context, 'readme')).toBe(true);
    });

    it('should return false for missing modules', () => {
      expect(hasModule(context, 'nonexistent')).toBe(false);
    });
  });

  describe('hasAnyModule', () => {
    const context: TemplateContext = {
      project: {},
      modules: {
        agents: ['tech-lead'],
        skills: [],
        commands: [],
        docs: [],
      },
      codeStyle: {},
      techStack: {},
      bundles: [],
      mcpServers: [],
      custom: {},
    };

    it('should return true if any module is present', () => {
      expect(hasAnyModule(context, ['tech-lead', 'missing'])).toBe(true);
    });

    it('should return false if no modules are present', () => {
      expect(hasAnyModule(context, ['missing1', 'missing2'])).toBe(false);
    });
  });

  describe('hasAllModules', () => {
    const context: TemplateContext = {
      project: {},
      modules: {
        agents: ['tech-lead', 'react-dev'],
        skills: [],
        commands: [],
        docs: [],
      },
      codeStyle: {},
      techStack: {},
      bundles: [],
      mcpServers: [],
      custom: {},
    };

    it('should return true if all modules are present', () => {
      expect(hasAllModules(context, ['tech-lead', 'react-dev'])).toBe(true);
    });

    it('should return false if any module is missing', () => {
      expect(hasAllModules(context, ['tech-lead', 'missing'])).toBe(false);
    });
  });
});
