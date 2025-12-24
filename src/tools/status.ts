/**
 * memory_status - 查看記憶狀態與自動初始化
 */

import { LettaClient } from '../letta/client.js';
import { LettaError, LettaErrorCode } from '../letta/errors.js';
import { StatusResult } from '../letta/types.js';
import { ConfigManager } from '../config/index.js';
import { estimateTokens } from '../utils/token-counter.js';

const CORE_MEMORY_LIMIT = 2000;

export const statusTool = {
  name: 'memory_status',
  description: `查看記憶系統狀態，首次使用時自動初始化 Agent。
顯示：連線狀態、Core Memory 使用量、Archival 記錄數。`,
  inputSchema: {
    type: 'object' as const,
    properties: {
      init: {
        type: 'boolean',
        default: false,
        description: '強制重新初始化（謹慎使用）',
      },
    },
  },
};

export interface StatusArgs {
  init?: boolean;
}

export async function handleStatus(
  client: LettaClient,
  configManager: ConfigManager,
  args: StatusArgs
): Promise<StatusResult> {
  let agentId = configManager.getAgentId();
  let initializedNow = false;

  // 如果沒有 Agent ID 或強制初始化
  if (!agentId || args.init) {
    const projectName = configManager.getProjectPath().split('/').pop() || 'project';

    try {
      const agent = await client.createAgent({
        name: `claude-memory-${projectName}`,
        memory_blocks: [
          { label: 'project', value: `# ${projectName}\n\n專案記憶尚未初始化。`, limit: 2000 },
          { label: 'learnings', value: '# 學習紀錄\n\n', limit: 2000 },
          { label: 'decisions', value: '# 架構決策\n\n', limit: 2000 },
        ],
      });

      agentId = agent.id;
      configManager.saveAgentId(agent.id, agent.name);
      initializedNow = true;
    } catch (error) {
      if (error instanceof LettaError) {
        throw error;
      }
      throw new LettaError(
        LettaErrorCode.AGENT_CREATION_FAILED,
        `無法建立 Agent: ${error}`
      );
    }
  }

  // 取得 Agent 資訊
  try {
    const agent = await client.getAgent(agentId);
    const blocks = agent.memory?.blocks || [];

    // 計算 Core Memory 使用量
    let totalTokens = 0;
    for (const block of blocks) {
      totalTokens += block.tokens_count || estimateTokens(block.value);
    }

    // 取得 Archival 統計
    const archivalStats = await client.getArchivalStats(agentId);

    return {
      connected: true,
      agent: {
        id: agent.id,
        name: agent.name,
      },
      core_memory: {
        blocks: blocks.length,
        tokens_used: totalTokens,
        tokens_limit: CORE_MEMORY_LIMIT * blocks.length,
      },
      archival_memory: {
        total_entries: archivalStats.total,
        by_type: archivalStats.by_type,
      },
      initialized_now: initializedNow,
    };
  } catch (error) {
    // Agent 不存在，嘗試重新初始化
    if (
      error instanceof LettaError &&
      error.code === LettaErrorCode.AGENT_NOT_FOUND
    ) {
      return handleStatus(client, configManager, { init: true });
    }
    throw error;
  }
}
