#!/usr/bin/env node
/**
 * 快速測試 MCP Server
 */

import { spawn } from 'child_process';
import { createInterface } from 'readline';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serverPath = path.join(__dirname, 'dist', 'index.js');

console.log('=== Letta Memory MCP Quick Test ===\n');
console.log('LETTA_API_KEY:', process.env.LETTA_API_KEY ? '✅ Set' : '❌ Missing');
console.log('LETTA_AGENT_ID:', process.env.LETTA_AGENT_ID || '❌ Missing');
console.log('');

const server = spawn('node', [serverPath], {
  stdio: ['pipe', 'pipe', 'pipe'],
  env: process.env,
});

let messageId = 0;
const responses = new Map();

function send(method, params = {}) {
  const id = ++messageId;
  const request = { jsonrpc: '2.0', id, method, params };
  server.stdin.write(JSON.stringify(request) + '\n');
  return id;
}

async function waitForResponse(id, timeout = 30000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    if (responses.has(id)) return responses.get(id);
    await new Promise(r => setTimeout(r, 100));
  }
  throw new Error(`Timeout waiting for response ${id}`);
}

const rl = createInterface({ input: server.stdout });
rl.on('line', (line) => {
  try {
    const response = JSON.parse(line);
    if (response.id) responses.set(response.id, response);
  } catch (e) {}
});

server.stderr.on('data', (data) => {
  console.error('Server error:', data.toString());
});

async function runTests() {
  try {
    // 1. Initialize
    console.log('1. Initializing...');
    const initId = send('initialize', {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: { name: 'quick-test', version: '1.0.0' },
    });
    const initResp = await waitForResponse(initId);
    console.log('   ✅ Server:', initResp.result?.serverInfo?.name);

    server.stdin.write(JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }) + '\n');

    // 2. Call memory_status
    console.log('\n2. Calling memory_status...');
    const statusId = send('tools/call', { name: 'memory_status', arguments: {} });
    const statusResp = await waitForResponse(statusId, 30000);

    if (statusResp.result?.isError) {
      console.log('   ❌ Error:', JSON.parse(statusResp.result.content[0].text).error);
    } else {
      const status = JSON.parse(statusResp.result.content[0].text);
      console.log('   ✅ Connected:', status.connected);
      console.log('   ✅ Agent:', status.agent?.name);
      console.log('   ✅ Core Memory:', status.core_memory?.tokens_used, 'tokens');
    }

    // 3. Call memory_recall
    console.log('\n3. Calling memory_recall...');
    const recallId = send('tools/call', { name: 'memory_recall', arguments: { block: 'all' } });
    const recallResp = await waitForResponse(recallId, 15000);

    if (recallResp.result?.isError) {
      console.log('   ❌ Error');
    } else {
      const recall = JSON.parse(recallResp.result.content[0].text);
      console.log('   ✅ Blocks:');
      for (const block of recall.blocks || []) {
        console.log(`      - ${block.label}: ${block.tokens} tokens`);
      }
    }

    console.log('\n=== Test Complete ===\n');
  } catch (error) {
    console.error('Test failed:', error.message);
  } finally {
    server.kill();
    process.exit(0);
  }
}

runTests();
