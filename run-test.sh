#!/bin/bash
set -e

cd /Users/user/Workspace/omniflow-studio/packages/letta-memory-mcp

# 載入環境變數
export LETTA_API_KEY="$(grep LETTA_API_KEY /Users/user/Workspace/omniflow-studio/.env | cut -d= -f2)"

echo "LETTA_API_KEY set: ${LETTA_API_KEY:0:20}..."

# 啟動 Server 並測試
echo ""
echo "Starting MCP Server..."
node dist/index.js &
PID=$!
sleep 2

if ps -p $PID > /dev/null 2>&1; then
  echo "✅ Server is running (PID: $PID)"
  echo ""
  echo "Server is waiting for MCP protocol messages on stdin."
  echo "Killing server..."
  kill $PID 2>/dev/null
  echo "Done."
else
  echo "❌ Server exited"
fi
