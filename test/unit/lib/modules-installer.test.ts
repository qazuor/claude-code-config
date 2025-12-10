/**
 * Tests for module installer utilities
 */

import { describe, expect, it } from 'vitest';
import { removeConfigRequiredFromFrontmatter } from '../../../src/lib/modules/installer.js';

describe('modules installer utilities', () => {
  describe('removeConfigRequiredFromFrontmatter', () => {
    it('should remove config_required section from frontmatter', () => {
      const input = `---
name: test-agent
description: A test agent
config_required:
  - API_PATH: "Path to API source code"
  - ORM: "Database ORM"
---

# Test Agent

Some content here.`;

      const expected = `---
name: test-agent
description: A test agent
---

# Test Agent

Some content here.`;

      const result = removeConfigRequiredFromFrontmatter(input);
      expect(result).toBe(expected);
    });

    it('should handle multiple config_required items', () => {
      const input = `---
name: api-engineer
description: Designs API routes
tools: Read, Write, Edit
config_required:
  - API_FRAMEWORK: "The API framework used (e.g., Hono, Express)"
  - API_PATH: "Path to API source code (e.g., apps/api/)"
  - AUTH_PROVIDER: "Authentication provider (e.g., Clerk)"
  - VALIDATION_LIB: "Validation library (e.g., Zod)"
---

# API Engineer Agent`;

      const result = removeConfigRequiredFromFrontmatter(input);

      expect(result).not.toContain('config_required');
      expect(result).not.toContain('API_FRAMEWORK');
      expect(result).not.toContain('API_PATH');
      expect(result).toContain('name: api-engineer');
      expect(result).toContain('description: Designs API routes');
      expect(result).toContain('tools: Read, Write, Edit');
    });

    it('should preserve other frontmatter fields', () => {
      const input = `---
name: test-skill
category: testing
description: A test skill
usage: Use for testing
config_required:
  - TEST_FRAMEWORK: "Your test framework"
---

# Test Skill`;

      const result = removeConfigRequiredFromFrontmatter(input);

      expect(result).toContain('name: test-skill');
      expect(result).toContain('category: testing');
      expect(result).toContain('description: A test skill');
      expect(result).toContain('usage: Use for testing');
      expect(result).not.toContain('config_required');
      expect(result).not.toContain('TEST_FRAMEWORK');
    });

    it('should return unchanged content if no frontmatter', () => {
      const input = `# Just a heading

Some content without frontmatter.`;

      const result = removeConfigRequiredFromFrontmatter(input);
      expect(result).toBe(input);
    });

    it('should return unchanged content if no config_required', () => {
      const input = `---
name: simple-agent
description: An agent without config_required
---

# Simple Agent

Content here.`;

      const result = removeConfigRequiredFromFrontmatter(input);
      expect(result).toBe(input);
    });

    it('should handle config_required at the end of frontmatter', () => {
      const input = `---
name: test
config_required:
  - KEY: "value"
---

Content`;

      const result = removeConfigRequiredFromFrontmatter(input);

      expect(result).toContain('name: test');
      expect(result).not.toContain('config_required');
      expect(result).toContain('Content');
    });

    it('should handle config_required at the start of frontmatter', () => {
      const input = `---
config_required:
  - KEY: "value"
name: test
description: test description
---

Content`;

      const result = removeConfigRequiredFromFrontmatter(input);

      expect(result).toContain('name: test');
      expect(result).toContain('description: test description');
      expect(result).not.toContain('config_required');
    });

    it('should preserve content after frontmatter exactly', () => {
      const input = `---
name: test
config_required:
  - KEY: "value"
---

# Header

## Sub Header

Some paragraph with **bold** and *italic*.

\`\`\`typescript
const code = 'example';
\`\`\``;

      const result = removeConfigRequiredFromFrontmatter(input);

      expect(result).toContain('# Header');
      expect(result).toContain('## Sub Header');
      expect(result).toContain('Some paragraph with **bold** and *italic*.');
      expect(result).toContain("const code = 'example';");
    });

    it('should handle empty config_required section', () => {
      const input = `---
name: test
config_required:
description: A description
---

Content`;

      const result = removeConfigRequiredFromFrontmatter(input);

      // This case tests when config_required has no items
      expect(result).toContain('name: test');
    });
  });
});
