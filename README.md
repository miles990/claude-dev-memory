# Claude Dev Memory

> 讓 Claude Code 具備跨 session 的長期記憶能力

## 痛點

```
Session 1                    Session 2
┌─────────────────┐          ┌─────────────────┐
│ 學到了解法 A     │   /clear  │ 這問題怎麼解？   │ ← 學習消失
│ 決定用架構 B     │  ───────>  │ 要用什麼架構？   │ ← 決策遺失
│ 專案進度 70%    │          │ 做到哪了？       │ ← 進度歸零
└─────────────────┘          └─────────────────┘
```

**Claude Code 的限制：**
- 每次 `/clear` 或新 session 就完全失憶
- 過去的學習和決策無法累積
- 沒有工具可以主動保存重要資訊

## 解決方案

這個 MCP Server 提供 5 個工具，讓 Claude 可以**主動讀寫**長期記憶：

| 工具 | 用途 |
|------|------|
| `memory_status` | 查看記憶系統狀態 |
| `memory_recall` | 讀取 Core Memory |
| `memory_update` | 更新 Core Memory |
| `memory_archive` | 存入 Archival Memory（完整文件） |
| `memory_search` | 語意搜尋歷史記錄 |

## 記憶架構

```
┌─────────────────────────────────────────────────────────────────┐
│                       Core Memory                                │
│                  (小而重要，~2000 tokens)                         │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐                │
│  │   project   │ │  learnings  │ │  decisions  │                │
│  │  專案概述    │ │  學習紀錄    │ │  架構決策    │                │
│  └─────────────┘ └─────────────┘ └─────────────┘                │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Archival Memory                              │
│                  (大而完整，無限制)                               │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐               │
│  │  specs  │ │ commits │ │learnings│ │decisions│               │
│  │完整規格  │ │提交記錄  │ │詳細筆記  │ │完整文檔  │               │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘               │
└─────────────────────────────────────────────────────────────────┘
```

**設計理念：**
- **Core Memory**：摘要性質，每次對話都載入，讓 Claude 快速了解專案
- **Archival Memory**：完整內容，需要時搜尋取用，保留所有細節

## 與 claude-memory-hook 的關係

這兩個工具是互補的：

| 工具 | 類型 | 職責 |
|------|------|------|
| [claude-memory-hook](https://github.com/miles990/claude-memory-hook) | Hook | 啟動時**顯示**狀態（被動） |
| **claude-dev-memory** | MCP Server | 提供**讀寫**記憶工具（主動） |

```
┌─────────────────────────────────────────────────────────────────┐
│  claude-memory-hook                                              │
│  → Session 開始時自動執行                                        │
│  → 顯示 Git、規格進度、Letta 記憶摘要、提醒                       │
├─────────────────────────────────────────────────────────────────┤
│  claude-dev-memory（本專案）                                     │
│  → 提供 MCP 工具讓 Claude 主動讀寫記憶                           │
│  → memory_recall / memory_update / memory_archive / memory_search│
└─────────────────────────────────────────────────────────────────┘
```

## 安裝

```bash
npm install -g claude-dev-memory
```

或使用 npx（無需安裝）：

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
# 在 shell profile 或專案 .env 中
export LETTA_API_KEY=sk-let-xxxxx
export LETTA_AGENT_ID=agent-xxxxx
```

或使用 JSON 配置（`~/.claude.json`）：

```json
{
  "mcpServers": {
    "claude-dev-memory": {
      "command": "npx",
      "args": ["claude-dev-memory"],
      "env": {
        "LETTA_API_KEY": "your-api-key",
        "LETTA_AGENT_ID": "agent-xxxxx"
      }
    }
  }
}
```

## 工具詳細說明

### memory_status

查看記憶系統狀態。

```
回傳：連線狀態、Core Memory 使用量、Archival 記錄數
```

### memory_recall

讀取 Core Memory，恢復專案上下文。

| 參數 | 類型 | 說明 |
|------|------|------|
| block | string | `all`、`project`、`learnings`、`decisions` |

### memory_update

更新 Core Memory，記錄專案進度和決策。

| 參數 | 類型 | 說明 |
|------|------|------|
| block | string | `project`、`learnings`、`decisions` |
| content | string | 完整替換內容 |
| append | string | 附加內容（二選一） |
| auto_summarize | boolean | 超過限制時自動摘要（預設 false） |

### memory_archive

存入 Archival Memory，保存完整文檔。

| 參數 | 類型 | 說明 |
|------|------|------|
| content | string | 要存檔的內容 |
| type | string | `spec`、`commit`、`learning`、`decision` |
| tags | string[] | 標籤陣列（方便搜尋） |

### memory_search

搜尋 Archival Memory，找出相關記錄。

| 參數 | 類型 | 說明 |
|------|------|------|
| query | string | 搜尋關鍵字 |
| filter | string | `all`、`spec`、`commit`、`learning`、`decision` |
| limit | number | 回傳筆數上限（預設 5） |
| min_relevance | number | 最低相關度 0-1（預設 0.7） |

## MCP Resource

### letta://memory/core

被動讀取 Core Memory 內容，回傳 JSON 格式的完整記憶資料。

## 使用情境

### Session 開始時恢復上下文
```
Claude 使用 memory_recall 讀取 project 區塊
→ 立即了解專案背景，無需重新解釋
```

### 完成重要決策後記錄
```
Claude 使用 memory_update 更新 decisions 區塊
→ 下次 session 仍記得這個決策
```

### 保存完整 spec 文檔
```
Claude 使用 memory_archive，type 設為 spec
→ 完整內容存入 Archival，可語意搜尋
```

### 遇到類似問題時搜尋
```
Claude 使用 memory_search 搜尋相關記錄
→ 找出過去的解法，避免重複踩坑
```

## 與官方 letta-mcp 的差異

| 面向 | 官方 letta-mcp | claude-dev-memory |
|------|----------------|-------------------|
| 目標用戶 | 通用 AI 應用 | Claude Code 開發者 |
| Memory 結構 | 單一 human block | project / learnings / decisions |
| Agent 策略 | 自動建立 per user | 指定現有 Agent |
| 額外功能 | - | Token 計算、狀態檢查、類型標籤 |

## 環境變數

| 變數 | 說明 | 預設值 |
|------|------|--------|
| LETTA_API_KEY | Letta Cloud API Key | (必填) |
| LETTA_AGENT_ID | 指定使用的 Agent ID | (選填) |
| LETTA_BASE_URL | Letta API URL | https://api.letta.com |

## 專案配置

可在專案目錄建立 `.claude/letta.json` 覆蓋全域設定：

```json
{
  "agent_id": "agent-xxx"
}
```

## 開發

```bash
git clone https://github.com/miles990/claude-dev-memory.git
cd claude-dev-memory

npm install     # 安裝依賴
npm run build   # 編譯
npm test        # 測試
npm run dev     # 開發模式
```

## 相關專案

- [claude-memory-hook](https://github.com/miles990/claude-memory-hook) - Session 啟動時自動載入記憶狀態的 Hook
- [Letta (MemGPT)](https://docs.letta.com/) - 長期記憶後端

## License

MIT
