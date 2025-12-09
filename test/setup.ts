/**
 * Test setup file
 */
import { afterEach, beforeEach, vi } from 'vitest';

// Reset all mocks before each test
beforeEach(() => {
  vi.clearAllMocks();
});

// Clean up after each test
afterEach(() => {
  vi.restoreAllMocks();
});

// Mock console methods to avoid noise in tests
vi.spyOn(console, 'log').mockImplementation(() => {});
vi.spyOn(console, 'error').mockImplementation(() => {});
vi.spyOn(console, 'warn').mockImplementation(() => {});

// Global test utilities
export const TEST_FIXTURES_DIR = new URL('./fixtures', import.meta.url).pathname;
