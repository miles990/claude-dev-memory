/**
 * 配置管理器
 *
 * 整合環境變數和專案配置
 */

import { getEnvConfig, validateEnvConfig, EnvConfig } from './env.js';
import {
  getProjectConfig,
  setProjectConfig,
  getCurrentProjectPath,
  ProjectConfig,
} from './project.js';

export { EnvConfig, ProjectConfig };
export { getEnvConfig, validateEnvConfig } from './env.js';
export {
  getProjectConfig,
  setProjectConfig,
  getCurrentProjectPath,
} from './project.js';

export interface ConfigManagerOptions {
  projectPath?: string;
}

export class ConfigManager {
  private projectPath: string;
  private envConfig: EnvConfig | null = null;
  private projectConfig: ProjectConfig | null = null;

  constructor(options: ConfigManagerOptions = {}) {
    this.projectPath = options.projectPath || getCurrentProjectPath();
  }

  /**
   * 初始化配置
   */
  initialize(): void {
    this.envConfig = getEnvConfig();
    this.projectConfig = getProjectConfig(this.projectPath);
  }

  /**
   * 取得 Letta API Key
   */
  getApiKey(): string {
    if (!this.envConfig) {
      this.initialize();
    }
    return this.envConfig!.apiKey;
  }

  /**
   * 取得 Letta Base URL
   */
  getBaseUrl(): string {
    if (!this.envConfig) {
      this.initialize();
    }
    return this.envConfig!.baseUrl;
  }

  /**
   * 取得 Agent ID（優先順序：環境變數 > 專案配置）
   */
  getAgentId(): string | null {
    if (!this.envConfig) {
      this.initialize();
    }

    // 1. 環境變數優先
    if (this.envConfig!.agentId) {
      return this.envConfig!.agentId;
    }

    // 2. 專案配置
    if (this.projectConfig?.agent_id) {
      return this.projectConfig.agent_id;
    }

    return null;
  }

  /**
   * 儲存 Agent ID 到專案配置
   */
  saveAgentId(agentId: string, agentName?: string): void {
    const config: ProjectConfig = {
      agent_id: agentId,
      agent_name: agentName,
      created_at: new Date().toISOString(),
    };

    setProjectConfig(this.projectPath, config);
    this.projectConfig = config;
  }

  /**
   * 驗證配置
   */
  validate(): { valid: boolean; errors: string[] } {
    return validateEnvConfig();
  }

  /**
   * 取得專案路徑
   */
  getProjectPath(): string {
    return this.projectPath;
  }

  /**
   * 檢查是否有 Agent ID
   */
  hasAgentId(): boolean {
    return this.getAgentId() !== null;
  }
}
