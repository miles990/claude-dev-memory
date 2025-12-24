/**
 * Letta Memory MCP Server
 * 提供長期記憶功能給 Claude Code
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  ErrorCode,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';

import { LettaClient } from './letta/client.js';
import { LettaError } from './letta/errors.js';
import { ConfigManager } from './config/index.js';
import { getAllTools, handleToolCall } from './tools/index.js';
import { getAllResources, handleResourceRead } from './resources/index.js';

/**
 * 建立並啟動 MCP Server
 */
export async function createServer(): Promise<Server> {
  // 初始化配置管理器
  const configManager = new ConfigManager();

  // 初始化 Letta Client
  const client = new LettaClient({
    apiKey: configManager.getApiKey(),
    baseUrl: configManager.getBaseUrl(),
  });

  // 建立 MCP Server
  const server = new Server(
    {
      name: 'letta-memory-mcp',
      version: '1.0.0',
    },
    {
      capabilities: {
        tools: {},
        resources: {},
      },
    }
  );

  // 註冊工具列表處理器
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    const tools = getAllTools();
    return {
      tools: tools.map((tool) => ({
        name: tool.name,
        description: tool.description,
        inputSchema: tool.inputSchema,
      })),
    };
  });

  // 註冊工具調用處理器
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      const result = await handleToolCall(
        name,
        args || {},
        client,
        configManager
      );

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (error) {
      if (error instanceof LettaError) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                error: error.code,
                message: error.message,
                suggestion: error.suggestion,
              }),
            },
          ],
          isError: true,
        };
      }

      throw new McpError(
        ErrorCode.InternalError,
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  });

  // 註冊資源列表處理器
  server.setRequestHandler(ListResourcesRequestSchema, async () => {
    const resources = getAllResources();
    return {
      resources: resources.map((resource) => ({
        uri: resource.uri,
        name: resource.name,
        description: resource.description,
        mimeType: resource.mimeType,
      })),
    };
  });

  // 註冊資源讀取處理器
  server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const { uri } = request.params;

    try {
      const agentId = configManager.getAgentId();
      const content = await handleResourceRead(uri, client, agentId);

      return {
        contents: [
          {
            uri,
            mimeType: 'application/json',
            text: JSON.stringify(content, null, 2),
          },
        ],
      };
    } catch (error) {
      if (error instanceof LettaError) {
        throw new McpError(ErrorCode.InternalError, error.message);
      }
      throw new McpError(
        ErrorCode.InternalError,
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  });

  return server;
}

/**
 * 啟動 Server（使用 stdio 傳輸）
 */
export async function startServer(): Promise<void> {
  const server = await createServer();
  const transport = new StdioServerTransport();

  await server.connect(transport);

  // 優雅關閉
  process.on('SIGINT', async () => {
    await server.close();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    await server.close();
    process.exit(0);
  });
}
