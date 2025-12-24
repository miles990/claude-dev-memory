/**
 * MCP Resources - 資源模組入口
 * 提供 MCP Resource 註冊和讀取的統一介面
 */

import { LettaClient } from '../letta/client.js';
import { LettaError, LettaErrorCode } from '../letta/errors.js';
import { coreMemoryResource, readCoreMemory, CoreMemoryContent } from './core-memory.js';

export * from './core-memory.js';

/**
 * MCP Resource 定義格式
 */
export interface MCPResourceDefinition {
  uri: string;
  name: string;
  description: string;
  mimeType: string;
}

/**
 * 取得所有 Resource 定義（供 MCP Server 註冊使用）
 */
export function getAllResources(): MCPResourceDefinition[] {
  return [coreMemoryResource];
}

/**
 * Resource 內容類型
 */
export type ResourceContent = CoreMemoryContent;

/**
 * 統一的 Resource 讀取處理
 */
export async function handleResourceRead(
  uri: string,
  client: LettaClient,
  agentId: string | null
): Promise<ResourceContent> {
  if (uri === 'letta://memory/core') {
    if (!agentId) {
      throw new LettaError(
        LettaErrorCode.AGENT_NOT_FOUND,
        '尚未初始化。請先呼叫 memory_status 工具。'
      );
    }
    return readCoreMemory(client, agentId);
  }

  throw new LettaError(
    LettaErrorCode.UNKNOWN,
    `未知的 Resource URI: ${uri}`
  );
}
