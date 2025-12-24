/**
 * memory_archive - 存入 Archival Memory
 */

import { LettaClient } from '../letta/client.js';
import { ArchiveResult } from '../letta/types.js';

export const archiveTool = {
  name: 'memory_archive',
  description: `存入 Archival Memory，保存完整 spec、commit、學習紀錄。
特性：無大小限制、可語意搜尋。`,
  inputSchema: {
    type: 'object' as const,
    properties: {
      content: {
        type: 'string',
        description: '要存檔的內容',
      },
      type: {
        type: 'string',
        enum: ['spec', 'commit', 'learning', 'decision'],
        description: '內容類型',
      },
      tags: {
        type: 'array',
        items: { type: 'string' },
        description: '標籤（方便搜尋）',
      },
    },
    required: ['content', 'type'],
  },
};

export interface ArchiveArgs {
  content: string;
  type: 'spec' | 'commit' | 'learning' | 'decision';
  tags?: string[];
}

export async function handleArchive(
  client: LettaClient,
  agentId: string,
  args: ArchiveArgs
): Promise<ArchiveResult> {
  const entry = await client.insertArchival(agentId, args.content, {
    type: args.type,
    tags: args.tags,
    created_at: new Date().toISOString(),
  });

  return {
    id: entry.id,
    type: args.type,
    tags: args.tags,
    created_at: new Date().toISOString(),
  };
}
