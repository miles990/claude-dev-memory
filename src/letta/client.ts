/**
 * Letta Cloud API Client
 */

import {
  Agent,
  ArchivalEntry,
  ArchivalMetadata,
  CreateAgentParams,
  LettaConfig,
  MemoryBlock,
} from './types.js';
import { LettaError, LettaErrorCode, errorFromStatus } from './errors.js';

const DEFAULT_BASE_URL = 'https://api.letta.com';
const DEFAULT_TIMEOUT = 10000; // 10 seconds
const MAX_RETRIES = 3;
const BASE_DELAY = 1000; // 1 second

export class LettaClient {
  private apiKey: string;
  private baseUrl: string;
  private timeout: number;

  constructor(config: LettaConfig) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || DEFAULT_BASE_URL;
    this.timeout = config.timeout || DEFAULT_TIMEOUT;
  }

  /**
   * 發送 HTTP 請求（含重試邏輯）
   */
  private async request<T>(
    method: string,
    path: string,
    body?: unknown
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        const response = await fetch(`${this.baseUrl}${path}`, {
          method,
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          body: body ? JSON.stringify(body) : undefined,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorText = await response.text().catch(() => '');
          throw errorFromStatus(response.status, errorText);
        }

        return (await response.json()) as T;
      } catch (error) {
        lastError = error as Error;

        // 不重試的錯誤
        if (error instanceof LettaError) {
          if (
            error.code === LettaErrorCode.UNAUTHORIZED ||
            error.code === LettaErrorCode.INVALID_API_KEY ||
            error.code === LettaErrorCode.CONTENT_TOO_LARGE
          ) {
            throw error;
          }
        }

        // AbortError = timeout
        if ((error as Error).name === 'AbortError') {
          lastError = new LettaError(LettaErrorCode.TIMEOUT);
        }

        // 最後一次嘗試，直接拋出
        if (attempt === MAX_RETRIES - 1) {
          break;
        }

        // 指數退避
        const delay = BASE_DELAY * Math.pow(2, attempt);
        await this.sleep(delay);
      }
    }

    throw lastError || new LettaError(LettaErrorCode.UNKNOWN);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // ─── Agent API ───────────────────────────────────────

  /**
   * 取得 Agent 資訊
   */
  async getAgent(agentId: string): Promise<Agent> {
    return this.request<Agent>('GET', `/v1/agents/${agentId}`);
  }

  /**
   * 建立新 Agent
   */
  async createAgent(params: CreateAgentParams): Promise<Agent> {
    const body = {
      name: params.name,
      memory_blocks: params.memory_blocks || [
        { label: 'project', value: '', limit: 2000 },
        { label: 'learnings', value: '', limit: 2000 },
        { label: 'decisions', value: '', limit: 2000 },
      ],
    };

    try {
      return await this.request<Agent>('POST', '/v1/agents', body);
    } catch (error) {
      if (error instanceof LettaError) {
        throw new LettaError(
          LettaErrorCode.AGENT_CREATION_FAILED,
          `無法建立 Agent: ${error.message}`
        );
      }
      throw error;
    }
  }

  /**
   * 健康檢查
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.request('GET', '/v1/health');
      return true;
    } catch {
      return false;
    }
  }

  // ─── Core Memory API ─────────────────────────────────

  /**
   * 取得 Core Memory
   */
  async getCoreMemory(agentId: string): Promise<MemoryBlock[]> {
    const agent = await this.getAgent(agentId);
    return agent.memory?.blocks || [];
  }

  /**
   * 更新 Memory Block
   */
  async updateMemoryBlock(
    agentId: string,
    blockLabel: string,
    content: string
  ): Promise<MemoryBlock> {
    // 先取得 block ID
    const blocks = await this.getCoreMemory(agentId);
    const block = blocks.find((b) => b.label === blockLabel);

    if (!block) {
      throw new LettaError(
        LettaErrorCode.BLOCK_NOT_FOUND,
        `Block "${blockLabel}" not found`
      );
    }

    // 更新 block
    return this.request<MemoryBlock>(
      'PATCH',
      `/v1/agents/${agentId}/memory/block/${block.id}`,
      { value: content }
    );
  }

  // ─── Archival Memory API ─────────────────────────────

  /**
   * 插入 Archival Memory
   */
  async insertArchival(
    agentId: string,
    content: string,
    metadata?: ArchivalMetadata
  ): Promise<ArchivalEntry> {
    const body = {
      text: content,
      metadata: metadata || {},
    };

    return this.request<ArchivalEntry>(
      'POST',
      `/v1/agents/${agentId}/archival`,
      body
    );
  }

  /**
   * 搜尋 Archival Memory
   */
  async searchArchival(
    agentId: string,
    query: string,
    limit: number = 5
  ): Promise<ArchivalEntry[]> {
    const params = new URLSearchParams({
      query,
      limit: limit.toString(),
    });

    return this.request<ArchivalEntry[]>(
      'GET',
      `/v1/agents/${agentId}/archival?${params}`
    );
  }

  /**
   * 取得 Archival Memory 統計
   */
  async getArchivalStats(
    agentId: string
  ): Promise<{ total: number; by_type: Record<string, number> }> {
    const entries = await this.request<ArchivalEntry[]>(
      'GET',
      `/v1/agents/${agentId}/archival?limit=1000`
    );

    const by_type: Record<string, number> = {};
    for (const entry of entries) {
      const type = entry.metadata?.type || 'other';
      by_type[type] = (by_type[type] || 0) + 1;
    }

    return {
      total: entries.length,
      by_type,
    };
  }
}
