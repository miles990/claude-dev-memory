/**
 * MCP Server 整合測試
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { spawn, ChildProcess } from 'child_process';
import { createInterface } from 'readline';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

describe('MCP Server Integration', () => {
  let server: ChildProcess;
  let messageId = 0;
  const responses = new Map<number, any>();

  // 發送 JSON-RPC 請求
  function send(method: string, params: any = {}): number {
    const id = ++messageId;
    const request = { jsonrpc: '2.0', id, method, params };
    server.stdin?.write(JSON.stringify(request) + '\n');
    return id;
  }

  // 等待回應
  async function waitForResponse(id: number, timeout = 10000): Promise<any> {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      if (responses.has(id)) {
        return responses.get(id);
      }
      await new Promise((r) => setTimeout(r, 50));
    }
    throw new Error(`Timeout waiting for response ${id}`);
  }

  beforeAll(async () => {
    // 確保有 API Key
    if (!process.env.LETTA_API_KEY) {
      throw new Error('LETTA_API_KEY environment variable is required for integration tests');
    }

    // 啟動 Server
    const serverPath = path.join(__dirname, '..', 'dist', 'index.js');
    server = spawn('node', [serverPath], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: process.env,
    });

    // 解析回應
    const rl = createInterface({ input: server.stdout! });
    rl.on('line', (line) => {
      try {
        const response = JSON.parse(line);
        if (response.id) {
          responses.set(response.id, response);
        }
      } catch (e) {
        // 忽略非 JSON
      }
    });

    // 等待 Server 啟動
    await new Promise((r) => setTimeout(r, 500));
  });

  afterAll(() => {
    server?.kill();
  });

  it('should initialize successfully', async () => {
    const id = send('initialize', {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: { name: 'test', version: '1.0.0' },
    });

    const response = await waitForResponse(id);
    expect(response.result).toBeDefined();
    expect(response.result.serverInfo.name).toBe('letta-memory-mcp');
  });

  it('should list tools', async () => {
    // Send initialized notification
    server.stdin?.write(JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }) + '\n');

    const id = send('tools/list');
    const response = await waitForResponse(id);

    expect(response.result.tools).toBeDefined();
    expect(response.result.tools.length).toBe(5);

    const toolNames = response.result.tools.map((t: any) => t.name);
    expect(toolNames).toContain('memory_status');
    expect(toolNames).toContain('memory_recall');
    expect(toolNames).toContain('memory_update');
    expect(toolNames).toContain('memory_archive');
    expect(toolNames).toContain('memory_search');
  });

  it('should list resources', async () => {
    const id = send('resources/list');
    const response = await waitForResponse(id);

    expect(response.result.resources).toBeDefined();
    expect(response.result.resources.length).toBe(1);
    expect(response.result.resources[0].uri).toBe('letta://memory/core');
  });

  it('should call memory_status (may fail with invalid API key)', async () => {
    const id = send('tools/call', {
      name: 'memory_status',
      arguments: {},
    });

    const response = await waitForResponse(id, 20000);

    expect(response.result).toBeDefined();
    expect(response.result.content).toBeDefined();
    expect(response.result.content[0].text).toBeDefined();

    // 無論成功或失敗，都應該有結構化的回應
    const contentText = response.result.content[0].text;
    const parsed = JSON.parse(contentText);

    if (response.result.isError) {
      // 錯誤情況：應該有 error 欄位
      expect(parsed.error).toBeDefined();
      console.log('Note: API call failed (expected with invalid key):', parsed.error);
    } else {
      // 成功情況：應該有 connected 欄位
      expect(parsed.connected).toBe(true);
      expect(parsed.agent).toBeDefined();
    }
  });
});
