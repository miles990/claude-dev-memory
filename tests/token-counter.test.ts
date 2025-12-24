/**
 * Token Counter 單元測試
 */

import { describe, it, expect } from 'vitest';
import { estimateTokens, exceedsTokenLimit, getSummary } from '../src/utils/token-counter.js';

describe('estimateTokens', () => {
  it('should return 0 for empty string', () => {
    expect(estimateTokens('')).toBe(0);
  });

  it('should estimate tokens correctly for ASCII text', () => {
    // ~4 chars per token
    const text = 'Hello, World!'; // 13 chars
    const tokens = estimateTokens(text);
    expect(tokens).toBeGreaterThan(0);
    expect(tokens).toBeLessThanOrEqual(5);
  });

  it('should estimate more tokens for Chinese text relative to char count', () => {
    // Chinese characters are ~2 chars per token (vs ~4 for ASCII)
    // So same number of chars should yield more tokens for Chinese
    const chinese = '你好世界這是測試'; // 8 Chinese chars
    const english = 'abcdefgh'; // 8 ASCII chars

    // Chinese should have more tokens than English for same char count
    // Because Chinese is ~2 chars/token vs ~4 chars/token for ASCII
    expect(estimateTokens(chinese)).toBeGreaterThanOrEqual(estimateTokens(english));
  });

  it('should handle mixed content', () => {
    const mixed = 'Hello 你好 World 世界';
    const tokens = estimateTokens(mixed);
    expect(tokens).toBeGreaterThan(0);
  });
});

describe('exceedsTokenLimit', () => {
  it('should return false for content under limit', () => {
    const shortText = 'Hello';
    expect(exceedsTokenLimit(shortText, 100)).toBe(false);
  });

  it('should return true for content over limit', () => {
    const longText = 'x'.repeat(10000); // ~2500 tokens
    expect(exceedsTokenLimit(longText, 100)).toBe(true);
  });

  it('should handle edge case at limit', () => {
    // Create text that's exactly at the limit
    const text = 'x'.repeat(400); // ~100 tokens
    expect(exceedsTokenLimit(text, 100)).toBe(false);
  });
});

describe('getSummary', () => {
  it('should return full text if under limit', () => {
    const text = 'Hello, World!';
    expect(getSummary(text, 100)).toBe(text);
  });

  it('should truncate long text with ellipsis', () => {
    const longText = 'This is a very long text that should be truncated at some point.';
    const summary = getSummary(longText, 20);
    expect(summary.length).toBeLessThanOrEqual(23); // 20 + '...'
    expect(summary.endsWith('...')).toBe(true);
  });

  it('should handle empty string', () => {
    expect(getSummary('', 100)).toBe('');
  });
});
