#!/bin/bash
# MCP Server 測試腳本

# 載入環境變數
source /Users/user/Workspace/omniflow-studio/.env

cd /Users/user/Workspace/omniflow-studio/packages/letta-memory-mcp

echo "=== Testing Letta Memory MCP Server ==="
echo ""

# 測試 1: 列出工具
echo "📋 Test 1: List Tools"
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | timeout 10 node dist/index.js 2>/dev/null | head -1 | jq -r '.result.tools[] | "  - \(.name): \(.description | split("\n")[0])"' 2>/dev/null || echo "  (parsing output...)"

echo ""

# 測試 2: 列出資源
echo "📦 Test 2: List Resources"
echo '{"jsonrpc":"2.0","id":2,"method":"resources/list"}' | timeout 10 node dist/index.js 2>/dev/null | head -1 | jq -r '.result.resources[] | "  - \(.uri): \(.name)"' 2>/dev/null || echo "  (parsing output...)"

echo ""

# 測試 3: 呼叫 memory_status
echo "🔍 Test 3: Call memory_status"
echo '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"memory_status","arguments":{}}}' | timeout 15 node dist/index.js 2>/dev/null | head -1 | jq -r '.result.content[0].text' 2>/dev/null | jq '.' 2>/dev/null || echo "  (parsing output...)"

echo ""
echo "=== Tests Complete ==="
