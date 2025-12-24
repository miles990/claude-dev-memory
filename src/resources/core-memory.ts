/**
 * Core Memory Resource - MCP Resource 實作
 * TODO: M5 完成實作
 */

import { LettaClient } from '../letta/client.js';

export const coreMemoryResource = {
  uri: 'letta://memory/core',
  name: 'Core Memory',
  description: '專案的核心記憶，包含 project、learnings、decisions 三個區塊',
  mimeType: 'application/json',
};

export interface CoreMemoryContent {
  blocks: Array<{
    label: string;
    value: string;
    tokens: number;
  }>;
  agent_id: string;
}

/**
 * 讀取 Core Memory 內容
 * @param client Letta Client
 * @param agentId Agent ID
 */
export async function readCoreMemory(
  client: LettaClient,
  agentId: string
): Promise<CoreMemoryContent> {
  const blocks = await client.getCoreMemory(agentId);

  return {
    blocks: blocks.map((b) => ({
      label: b.label,
      value: b.value,
      tokens: b.tokens_count || 0,
    })),
    agent_id: agentId,
  };
}
