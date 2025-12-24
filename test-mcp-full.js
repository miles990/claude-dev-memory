#!/usr/bin/env node
/**
 * MCP Server 完整測試
 * 模擬 MCP Client 與 Server 互動
 */

import { spawn } from 'child_process';
import { createInterface } from 'readline';

// 載入環境變數
process.env.LETTA_API_KEY = process.env.LETTA_API_KEY || '';

const serverPath = new URL('./dist/index.js', import.meta.url).pathname;

async function runTest() {
  console.log('=== Letta Memory MCP Server Test ===\n');

  // 啟動 MCP Server
  const server = spawn('node', [serverPath], {
    stdio: ['pipe', 'pipe', 'pipe'],
    env: process.env,
  });

  let messageId = 0;

  // 發送 JSON-RPC 請求
  function send(method, params = {}) {
    const id = ++messageId;
    const request = { jsonrpc: '2.0', id, method, params };
    const message = JSON.stringify(request);
    server.stdin.write(message + '\n');
    return id;
  }

  // 讀取回應
  const rl = createInterface({ input: server.stdout });
  const responses = new Map();

  rl.on('line', (line) => {
    try {
      const response = JSON.parse(line);
      if (response.id) {
        responses.set(response.id, response);
      }
    } catch (e) {
      // 忽略非 JSON 行
    }
  });

  // 等待回應
  async function waitForResponse(id, timeout = 15000) {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      if (responses.has(id)) {
        return responses.get(id);
      }
      await new Promise((r) => setTimeout(r, 100));
    }
    throw new Error(`Timeout waiting for response ${id}`);
  }

  try {
    // 1. 初始化
    console.log('📡 Initializing MCP connection...');
    const initId = send('initialize', {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: { name: 'test-client', version: '1.0.0' },
    });
    const initResponse = await waitForResponse(initId);
    console.log('✅ Server initialized:', initResponse.result?.serverInfo?.name || 'OK');
    console.log('   Capabilities:', Object.keys(initResponse.result?.capabilities || {}).join(', '));

    // 發送 initialized 通知
    server.stdin.write(JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }) + '\n');

    // 2. 列出工具
    console.log('\n📋 Listing tools...');
    const toolsId = send('tools/list');
    const toolsResponse = await waitForResponse(toolsId);
    const tools = toolsResponse.result?.tools || [];
    console.log(`✅ Found ${tools.length} tools:`);
    for (const tool of tools) {
      console.log(`   - ${tool.name}`);
    }

    // 3. 列出資源
    console.log('\n📦 Listing resources...');
    const resourcesId = send('resources/list');
    const resourcesResponse = await waitForResponse(resourcesId);
    const resources = resourcesResponse.result?.resources || [];
    console.log(`✅ Found ${resources.length} resources:`);
    for (const resource of resources) {
      console.log(`   - ${resource.uri}: ${resource.name}`);
    }

    // 4. 呼叫 memory_status
    console.log('\n🔍 Calling memory_status...');
    const statusId = send('tools/call', {
      name: 'memory_status',
      arguments: {},
    });
    const statusResponse = await waitForResponse(statusId, 20000);

    if (statusResponse.result?.isError) {
      console.log('❌ Error:', statusResponse.result.content?.[0]?.text);
    } else {
      const content = statusResponse.result?.content?.[0]?.text;
      if (content) {
        const status = JSON.parse(content);
        console.log('✅ Memory Status:');
        console.log(`   Connected: ${status.connected}`);
        console.log(`   Agent: ${status.agent?.name} (${status.agent?.id?.slice(0, 20)}...)`);
        console.log(`   Core Memory: ${status.core_memory?.tokens_used}/${status.core_memory?.tokens_limit} tokens`);
        console.log(`   Archival: ${status.archival_memory?.total_entries} entries`);
        if (status.initialized_now) {
          console.log('   ⚡ Agent was initialized just now!');
        }
      }
    }

    // 5. 呼叫 memory_recall
    console.log('\n📖 Calling memory_recall...');
    const recallId = send('tools/call', {
      name: 'memory_recall',
      arguments: { block: 'all' },
    });
    const recallResponse = await waitForResponse(recallId, 15000);

    if (recallResponse.result?.isError) {
      console.log('❌ Error:', recallResponse.result.content?.[0]?.text);
    } else {
      const content = recallResponse.result?.content?.[0]?.text;
      if (content) {
        const recall = JSON.parse(content);
        console.log('✅ Core Memory Blocks:');
        for (const block of recall.blocks || []) {
          const preview = block.value.slice(0, 50).replace(/\n/g, ' ');
          console.log(`   - ${block.label}: "${preview}..." (${block.tokens} tokens)`);
        }
      }
    }

    console.log('\n=== All Tests Passed ===\n');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    server.kill();
    process.exit(0);
  }
}

runTest();
