/**
 * Config Manager 單元測試
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ConfigManager } from '../src/config/index.js';
import * as fs from 'node:fs';
import * as path from 'node:path';

describe('ConfigManager', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset environment before each test
    vi.resetModules();
    process.env = { ...originalEnv };
    // Set dummy API key for tests that don't specifically test missing key
    process.env.LETTA_API_KEY = 'test-api-key-dummy';
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('getApiKey', () => {
    it('should read from LETTA_API_KEY environment variable', () => {
      process.env.LETTA_API_KEY = 'test-api-key';
      const manager = new ConfigManager();
      expect(manager.getApiKey()).toBe('test-api-key');
    });

    it('should throw if API key is not set', () => {
      delete process.env.LETTA_API_KEY;
      const manager = new ConfigManager();
      expect(() => manager.getApiKey()).toThrow();
    });
  });

  describe('getBaseUrl', () => {
    it('should use default URL if not set', () => {
      delete process.env.LETTA_BASE_URL;
      const manager = new ConfigManager();
      expect(manager.getBaseUrl()).toBe('https://api.letta.com');
    });

    it('should read from LETTA_BASE_URL if set', () => {
      process.env.LETTA_BASE_URL = 'https://custom.letta.com';
      const manager = new ConfigManager();
      expect(manager.getBaseUrl()).toBe('https://custom.letta.com');
    });
  });

  describe('getProjectPath', () => {
    it('should return current working directory', () => {
      const manager = new ConfigManager();
      expect(manager.getProjectPath()).toBe(process.cwd());
    });
  });

  describe('Agent ID management', () => {
    it('should return null if no agent ID is saved', () => {
      const manager = new ConfigManager('/tmp/test-project-' + Date.now());
      expect(manager.getAgentId()).toBeNull();
    });
  });
});
