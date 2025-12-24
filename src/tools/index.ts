/**
 * MCP Tools - 工具模組入口
 * 提供工具註冊和調用的統一介面
 */

import { LettaClient } from '../letta/client.js';
import { ConfigManager } from '../config/index.js';
import { LettaError, LettaErrorCode } from '../letta/errors.js';

// 匯出工具定義和處理函數
export * from './recall.js';
export * from './update.js';
export * from './archive.js';
export * from './search.js';
export * from './status.js';

// 匯入工具
import { recallTool, handleRecall, RecallArgs } from './recall.js';
import { updateTool, handleUpdate, UpdateArgs } from './update.js';
import { archiveTool, handleArchive, ArchiveArgs } from './archive.js';
import { searchTool, handleSearch, SearchArgs } from './search.js';
import { statusTool, handleStatus, StatusArgs } from './status.js';

/**
 * MCP Tool 定義格式
 */
export interface MCPToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

/**
 * 取得所有工具定義（供 MCP Server 註冊使用）
 */
export function getAllTools(): MCPToolDefinition[] {
  return [
    recallTool,
    updateTool,
    archiveTool,
    searchTool,
    statusTool,
  ];
}

/**
 * 工具調用參數類型
 */
export type ToolArgs = RecallArgs | UpdateArgs | ArchiveArgs | SearchArgs | StatusArgs;

/**
 * 統一的工具調用處理
 */
export async function handleToolCall(
  toolName: string,
  args: Record<string, unknown>,
  client: LettaClient,
  configManager: ConfigManager
): Promise<unknown> {
  // 取得 Agent ID（status 工具除外，它會自動初始化）
  const agentId = configManager.getAgentId();

  switch (toolName) {
    case 'memory_status':
      return handleStatus(client, configManager, args as StatusArgs);

    case 'memory_recall':
      if (!agentId) {
        throw new LettaError(
          LettaErrorCode.AGENT_NOT_FOUND,
          '尚未初始化。請先呼叫 memory_status 工具。'
        );
      }
      return handleRecall(client, agentId, args as RecallArgs);

    case 'memory_update':
      if (!agentId) {
        throw new LettaError(
          LettaErrorCode.AGENT_NOT_FOUND,
          '尚未初始化。請先呼叫 memory_status 工具。'
        );
      }
      return handleUpdate(client, agentId, args as unknown as UpdateArgs);

    case 'memory_archive':
      if (!agentId) {
        throw new LettaError(
          LettaErrorCode.AGENT_NOT_FOUND,
          '尚未初始化。請先呼叫 memory_status 工具。'
        );
      }
      return handleArchive(client, agentId, args as unknown as ArchiveArgs);

    case 'memory_search':
      if (!agentId) {
        throw new LettaError(
          LettaErrorCode.AGENT_NOT_FOUND,
          '尚未初始化。請先呼叫 memory_status 工具。'
        );
      }
      return handleSearch(client, agentId, args as unknown as SearchArgs);

    default:
      throw new LettaError(
        LettaErrorCode.UNKNOWN,
        `未知的工具: ${toolName}`
      );
  }
}
