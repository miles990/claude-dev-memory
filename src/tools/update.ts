/**
 * memory_update - 更新 Core Memory
 */

import { LettaClient } from '../letta/client.js';
import { LettaError, LettaErrorCode } from '../letta/errors.js';
import { UpdateResult } from '../letta/types.js';
import { estimateTokens, exceedsTokenLimit } from '../utils/token-counter.js';

const CORE_MEMORY_LIMIT = 2000; // tokens

export const updateTool = {
  name: 'memory_update',
  description: `更新 Core Memory，記錄專案進度和決策。
注意：Core Memory 有 ~2000 token 限制，超過時建議使用 memory_archive。`,
  inputSchema: {
    type: 'object' as const,
    properties: {
      block: {
        type: 'string',
        enum: ['project', 'learnings', 'decisions'],
        description: '要更新的記憶區塊',
      },
      content: {
        type: 'string',
        description: '新內容（完整替換）',
      },
      append: {
        type: 'string',
        description: '附加內容（加到現有內容後）',
      },
      auto_summarize: {
        type: 'boolean',
        default: false,
        description: '超過限制時自動摘要（預設 false）',
      },
    },
    required: ['block'],
  },
};

export interface UpdateArgs {
  block: 'project' | 'learnings' | 'decisions';
  content?: string;
  append?: string;
  auto_summarize?: boolean;
}

export async function handleUpdate(
  client: LettaClient,
  agentId: string,
  args: UpdateArgs
): Promise<UpdateResult> {
  // 取得現有內容
  const blocks = await client.getCoreMemory(agentId);
  const block = blocks.find((b) => b.label === args.block);

  if (!block) {
    throw new LettaError(
      LettaErrorCode.BLOCK_NOT_FOUND,
      `Block "${args.block}" not found`
    );
  }

  // 計算新內容
  let newContent: string;
  if (args.content !== undefined) {
    newContent = args.content;
  } else if (args.append !== undefined) {
    newContent = block.value + '\n' + args.append;
  } else {
    throw new LettaError(
      LettaErrorCode.UNKNOWN,
      '必須提供 content 或 append 參數'
    );
  }

  // 檢查 token 限制
  const tokenCount = estimateTokens(newContent);
  if (exceedsTokenLimit(newContent, CORE_MEMORY_LIMIT)) {
    if (!args.auto_summarize) {
      throw new LettaError(
        LettaErrorCode.CONTENT_TOO_LARGE,
        `內容超過 Core Memory 限制（${tokenCount} tokens > ${CORE_MEMORY_LIMIT}）。建議使用 memory_archive 存入 Archival Memory，或設定 auto_summarize: true 自動摘要。`
      );
    }

    // TODO: 實作自動摘要邏輯
    // 目前先截斷
    newContent = newContent.slice(0, CORE_MEMORY_LIMIT * 4);
  }

  // 更新 block
  const updated = await client.updateMemoryBlock(agentId, args.block, newContent);

  return {
    block: args.block,
    value: updated.value,
    tokens_used: estimateTokens(updated.value),
    tokens_limit: CORE_MEMORY_LIMIT,
    summarized: args.auto_summarize && tokenCount > CORE_MEMORY_LIMIT,
  };
}
