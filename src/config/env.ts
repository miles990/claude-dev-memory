/**
 * 環境變數配置
 */

export interface EnvConfig {
  apiKey: string;
  baseUrl: string;
  agentId?: string;
}

/**
 * 從環境變數讀取配置
 */
export function getEnvConfig(): EnvConfig {
  const apiKey = process.env.LETTA_API_KEY;

  if (!apiKey) {
    throw new Error(
      'LETTA_API_KEY 環境變數未設定。請在 Claude Code MCP 配置中加入此環境變數。'
    );
  }

  return {
    apiKey,
    baseUrl: process.env.LETTA_BASE_URL || 'https://api.letta.com',
    agentId: process.env.LETTA_AGENT_ID,
  };
}

/**
 * 驗證環境變數配置
 */
export function validateEnvConfig(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!process.env.LETTA_API_KEY) {
    errors.push('LETTA_API_KEY 未設定');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
