#!/usr/bin/env node
/**
 * Letta Memory MCP - 入口點
 *
 * 為 Claude Code 提供長期記憶功能的 MCP Server
 *
 * 使用方式:
 *   npx letta-memory-mcp
 *
 * 環境變數:
 *   LETTA_API_KEY - Letta Cloud API Key（必須）
 *   LETTA_BASE_URL - Letta API Base URL（選填，預設 https://api.letta.com）
 *
 * 專案配置:
 *   在專案目錄建立 .claude/letta.json 可覆蓋設定
 */

import { startServer } from './server.js';

// 啟動 Server
startServer().catch((error) => {
  console.error('Failed to start Letta Memory MCP:', error);
  process.exit(1);
});
