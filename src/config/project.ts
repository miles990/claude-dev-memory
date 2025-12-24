/**
 * 專案配置管理
 *
 * 讀寫 .claude/letta.json
 */

import * as fs from 'fs';
import * as path from 'path';

export interface ProjectConfig {
  agent_id: string;
  agent_name?: string;
  created_at?: string;
}

const CONFIG_DIR = '.claude';
const CONFIG_FILE = 'letta.json';

/**
 * 取得專案配置檔路徑
 */
function getConfigPath(projectPath: string): string {
  return path.join(projectPath, CONFIG_DIR, CONFIG_FILE);
}

/**
 * 讀取專案配置
 */
export function getProjectConfig(projectPath: string): ProjectConfig | null {
  const configPath = getConfigPath(projectPath);

  try {
    if (!fs.existsSync(configPath)) {
      return null;
    }

    const content = fs.readFileSync(configPath, 'utf-8');
    return JSON.parse(content) as ProjectConfig;
  } catch (error) {
    console.error(`讀取專案配置失敗: ${error}`);
    return null;
  }
}

/**
 * 儲存專案配置
 */
export function setProjectConfig(
  projectPath: string,
  config: ProjectConfig
): void {
  const configDir = path.join(projectPath, CONFIG_DIR);
  const configPath = getConfigPath(projectPath);

  try {
    // 確保目錄存在
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }

    // 寫入配置
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');
  } catch (error) {
    console.error(`儲存專案配置失敗: ${error}`);
    throw error;
  }
}

/**
 * 取得當前工作目錄
 */
export function getCurrentProjectPath(): string {
  return process.cwd();
}
