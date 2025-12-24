#!/bin/bash
# Test Letta API directly
# Requires: LETTA_API_KEY and LETTA_AGENT_ID environment variables

if [ -z "$LETTA_API_KEY" ] || [ -z "$LETTA_AGENT_ID" ]; then
  echo "Error: LETTA_API_KEY and LETTA_AGENT_ID must be set"
  echo "Usage: LETTA_API_KEY=xxx LETTA_AGENT_ID=agent-xxx ./test-api.sh"
  exit 1
fi

echo "Testing Letta API..."
echo ""

response=$(curl -s -w "\n%{http_code}" \
  "https://api.letta.com/v1/agents/${LETTA_AGENT_ID}" \
  -H "Authorization: Bearer ${LETTA_API_KEY}")

http_code=$(echo "$response" | tail -1)
body=$(echo "$response" | sed '$d')

echo "HTTP Status: $http_code"
echo ""

if [ "$http_code" = "200" ]; then
  echo "Agent Info:"
  echo "$body" | python3 -c "
import json, sys
data = json.load(sys.stdin)
print(f\"  Name: {data.get('name')}\")
print(f\"  ID: {data.get('id')}\")
blocks = data.get('memory', {}).get('blocks', [])
print(f\"  Memory Blocks: {len(blocks)}\")
for b in blocks:
    print(f\"    - {b['label']}: {len(b['value'])} chars\")
"
else
  echo "Error: $body"
fi
