/**
 * memory_recall - 讀取 Core Memory
 */

import { LettaClient } from '../letta/client.js';
import { RecallResult } from '../letta/types.js';
import { estimateTokens } from '../utils/token-counter.js';

export const recallTool = {
  name: 'memory_recall',
  description: `讀取專案的 Core Memory，取得專案上下文、學習紀錄、決策。
用於：session 開始時恢復上下文，或隨時查看記憶內容。`,
  inputSchema: {
    type: 'object' as const,
    properties: {
      block: {
        type: 'string',
        enum: ['all', 'project', 'learnings', 'decisions'],
        default: 'all',
        description: '要讀取的記憶區塊',
      },
    },
  },
};

export interface RecallArgs {
  block?: 'all' | 'project' | 'learnings' | 'decisions';
}

export async function handleRecall(
  client: LettaClient,
  agentId: string,
  args: RecallArgs
): Promise<RecallResult> {
  const blocks = await client.getCoreMemory(agentId);
  const blockFilter = args.block || 'all';

  const filteredBlocks = blocks
    .filter((b) => blockFilter === 'all' || b.label === blockFilter)
    .map((b) => ({
      label: b.label,
      value: b.value,
      tokens: b.tokens_count || estimateTokens(b.value),
    }));

  return {
    blocks: filteredBlocks,
    agent_id: agentId,
  };
}
