/**
 * memory_search - 搜尋 Archival Memory
 */

import { LettaClient } from '../letta/client.js';
import { SearchResult } from '../letta/types.js';
import { getSummary } from '../utils/token-counter.js';

export const searchTool = {
  name: 'memory_search',
  description: `搜尋 Archival Memory，找出相關的過去記錄。
用於：遇到類似問題時參考過去的解法。`,
  inputSchema: {
    type: 'object' as const,
    properties: {
      query: {
        type: 'string',
        description: '搜尋關鍵字或問題',
      },
      filter: {
        type: 'string',
        enum: ['all', 'spec', 'commit', 'learning', 'decision'],
        default: 'all',
        description: '過濾內容類型',
      },
      limit: {
        type: 'number',
        default: 5,
        description: '回傳筆數上限',
      },
      min_relevance: {
        type: 'number',
        default: 0.7,
        description: '最低相關度閾值 (0-1)',
      },
    },
    required: ['query'],
  },
};

export interface SearchArgs {
  query: string;
  filter?: 'all' | 'spec' | 'commit' | 'learning' | 'decision';
  limit?: number;
  min_relevance?: number;
}

export async function handleSearch(
  client: LettaClient,
  agentId: string,
  args: SearchArgs
): Promise<SearchResult> {
  const limit = args.limit || 5;
  const minRelevance = args.min_relevance || 0.7;
  const filter = args.filter || 'all';

  // 搜尋（多取一些，因為要過濾）
  const entries = await client.searchArchival(agentId, args.query, limit * 2);

  // 過濾和格式化結果
  const results = entries
    .filter((entry) => {
      // 過濾相關度
      if (entry.relevance !== undefined && entry.relevance < minRelevance) {
        return false;
      }
      // 過濾類型
      if (filter !== 'all' && entry.metadata?.type !== filter) {
        return false;
      }
      return true;
    })
    .slice(0, limit)
    .map((entry) => ({
      id: entry.id,
      content: entry.content,
      summary: getSummary(entry.content, 200),
      type: entry.metadata?.type || 'other',
      tags: entry.metadata?.tags || [],
      relevance: entry.relevance || 0,
      created_at: entry.metadata?.created_at || '',
    }));

  return {
    results,
    total_searched: entries.length,
  };
}
