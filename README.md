# Claude Dev Memory

為 Claude Code 開發工作流提供長期記憶功能的 MCP Server，透過 Letta Cloud API 實現跨 session 專案記憶。

## 功能特色

- **多區塊 Core Memory** - project / learnings / decisions（~2000 tokens）
- **Archival Memory** - 完整 spec、commit 記錄、詳細文檔（無大小限制）
- **專案導向** - 專為 Claude Code 開發工作流設計
- **語意搜尋** - 透過向量搜尋找出相關記憶

## 與官方 letta-memory-mcp 的差異

| 面向 | 官方 letta-memory-mcp | claude-dev-memory |
|------|----------------------|-------------------|
| 目標用戶 | 通用 AI 應用 | Claude Code 開發者 |
| Memory 結構 | 單一 human block | project / learnings / decisions |
| Agent 策略 | 自動建立 per user | 指定現有 Agent |
| 額外功能 | - | Token 計算、狀態檢查、類型標籤 |

## 安裝

```bash
npm install -g claude-dev-memory
```

或使用 npx：

```bash
npx claude-dev-memory
```

## 配置

### 1. 取得 Letta API Key

1. 前往 [Letta Cloud](https://app.letta.com/)
2. 註冊帳號並取得 API Key
3. 建立 Agent 並記下 Agent ID

### 2. 配置 Claude Code

```bash
claude mcp add claude-dev-memory -s user -- npx claude-dev-memory
```

設定環境變數：

```bash
# 在專案 .env 或 shell profile 中
export LETTA_API_KEY=sk-let-xxxxx
export LETTA_AGENT_ID=agent-xxxxx
```

或使用 JSON 配置：

```json
{
  "mcpServers": {
    "claude-dev-memory": {
      "command": "npx",
      "args": ["claude-dev-memory"],
      "env": {
        "LETTA_API_KEY": "your-api-key-here",
        "LETTA_AGENT_ID": "agent-xxxxx"
      }
    }
  }
}
```

## 工具說明

### memory_status

查看記憶系統狀態。

```
顯示：連線狀態、Core Memory 使用量、Archival 記錄數
```

### memory_recall

讀取 Core Memory，恢復專案上下文。

| 參數 | 說明 |
|------|------|
| block | 要讀取的區塊：all, project, learnings, decisions |

### memory_update

更新 Core Memory，記錄專案進度和決策。

| 參數 | 說明 |
|------|------|
| block | 要更新的區塊：project, learnings, decisions |
| content | 完整替換內容 |
| append | 附加內容 |
| auto_summarize | 超過限制時自動摘要（預設 false） |

### memory_archive

存入 Archival Memory，保存完整文檔。

| 參數 | 說明 |
|------|------|
| content | 要存檔的內容 |
| type | 內容類型：spec, commit, learning, decision |
| tags | 標籤陣列 |

### memory_search

搜尋 Archival Memory，找出相關記錄。

| 參數 | 說明 |
|------|------|
| query | 搜尋關鍵字 |
| filter | 過濾類型：all, spec, commit, learning, decision |
| limit | 回傳筆數上限（預設 5） |
| min_relevance | 最低相關度（預設 0.7） |

## MCP Resource

### letta://memory/core

被動讀取 Core Memory 內容，回傳 JSON 格式的完整記憶資料。

## 使用情境

### Session 開始時恢復上下文

```
使用 memory_recall 工具讀取 project 區塊
```

### 完成重要決策後記錄

```
使用 memory_update 工具更新 decisions 區塊
```

### 保存完整 spec 文檔

```
使用 memory_archive 工具，type 設為 spec
```

### 遇到類似問題時搜尋

```
使用 memory_search 工具搜尋相關記錄
```

## 記憶架構

```
┌─────────────────────────────────────────────────────────┐
│                     Core Memory                         │
│  (小而重要，~2000 tokens，每次對話都會載入)              │
│  ├── project: 專案概述、當前狀態、重點                   │
│  ├── learnings: 學習紀錄、解決方案                       │
│  └── decisions: 架構決策、設計選擇                       │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                   Archival Memory                        │
│  (大而完整，無限制，需要時搜尋取用)                       │
│  ├── specs: 完整規格文件                                 │
│  ├── commits: Git commit 記錄                            │
│  ├── learnings: 詳細學習筆記                             │
│  └── decisions: 完整決策文檔                             │
└─────────────────────────────────────────────────────────┘
```

## 環境變數

| 變數 | 說明 | 預設值 |
|------|------|--------|
| LETTA_API_KEY | Letta Cloud API Key | (必填) |
| LETTA_AGENT_ID | 指定使用的 Agent ID | (選填，可在 Letta 後台建立) |
| LETTA_BASE_URL | Letta API URL | https://api.letta.com |

## 專案配置

可在專案目錄建立 `.claude/letta.json` 覆蓋設定：

```json
{
  "agent_id": "agent-xxx"
}
```

## 開發

```bash
# Clone
git clone https://github.com/miles990/claude-dev-memory.git
cd claude-dev-memory

# 安裝依賴
npm install

# 編譯
npm run build

# 測試
npm test

# 開發模式
npm run dev
```

## 相關專案

- [claude-memory-hook](https://github.com/miles990/claude-memory-hook) - Claude Code session 啟動時自動載入記憶狀態

## License

MIT
