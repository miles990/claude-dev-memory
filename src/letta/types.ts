/**
 * Letta API 型別定義
 */

// Agent
export interface Agent {
  id: string;
  name: string;
  created_at: string;
  memory: {
    blocks: MemoryBlock[];
  };
}

// Memory Block (Core Memory)
export interface MemoryBlock {
  id: string;
  label: string; // "project" | "learnings" | "decisions"
  value: string;
  limit: number;
  tokens_count?: number;
}

// Archival Entry
export interface ArchivalEntry {
  id: string;
  content: string;
  metadata?: ArchivalMetadata;
  relevance?: number; // 搜尋時的相關度分數
}

export interface ArchivalMetadata {
  type?: 'spec' | 'commit' | 'learning' | 'decision';
  tags?: string[];
  created_at?: string;
}

// Create Agent Params
export interface CreateAgentParams {
  name: string;
  memory_blocks?: {
    label: string;
    value: string;
    limit?: number;
  }[];
}

// API Response
export interface LettaResponse<T> {
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

// Letta Client Config
export interface LettaConfig {
  apiKey: string;
  baseUrl?: string;
  timeout?: number;
}

// Tool Results
export interface RecallResult {
  blocks: {
    label: string;
    value: string;
    tokens: number;
  }[];
  agent_id: string;
  last_updated?: string;
}

export interface UpdateResult {
  block: string;
  value: string;
  tokens_used: number;
  tokens_limit: number;
  summarized?: boolean;
  archived_backup_id?: string;
}

export interface ArchiveResult {
  id: string;
  type: string;
  tags?: string[];
  created_at: string;
}

export interface SearchResult {
  results: {
    id: string;
    content: string;
    summary: string;
    type: string;
    tags: string[];
    relevance: number;
    created_at: string;
  }[];
  total_searched: number;
}

export interface StatusResult {
  connected: boolean;
  agent: {
    id: string;
    name: string;
  } | null;
  core_memory: {
    blocks: number;
    tokens_used: number;
    tokens_limit: number;
  } | null;
  archival_memory: {
    total_entries: number;
    by_type: Record<string, number>;
  } | null;
  initialized_now?: boolean;
}
