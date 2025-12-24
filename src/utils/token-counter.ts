/**
 * Token 計算工具
 *
 * 簡單估算 token 數量（約 4 字元 = 1 token）
 */

const CHARS_PER_TOKEN = 4;

/**
 * 估算文字的 token 數量
 */
export function estimateTokens(text: string): number {
  if (!text) return 0;
  return Math.ceil(text.length / CHARS_PER_TOKEN);
}

/**
 * 檢查是否超過 token 限制
 */
export function exceedsTokenLimit(text: string, limit: number): boolean {
  return estimateTokens(text) > limit;
}

/**
 * 截斷文字到指定 token 數量
 */
export function truncateToTokens(text: string, maxTokens: number): string {
  const maxChars = maxTokens * CHARS_PER_TOKEN;
  if (text.length <= maxChars) {
    return text;
  }
  return text.slice(0, maxChars - 3) + '...';
}

/**
 * 取得文字摘要（前 N 個字元）
 */
export function getSummary(text: string, maxLength: number = 200): string {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + '...';
}
