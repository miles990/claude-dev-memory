/**
 * Letta 錯誤處理
 */

export enum LettaErrorCode {
  // 連線錯誤
  CONNECTION_FAILED = 'CONNECTION_FAILED',
  TIMEOUT = 'TIMEOUT',

  // 認證錯誤
  INVALID_API_KEY = 'INVALID_API_KEY',
  UNAUTHORIZED = 'UNAUTHORIZED',

  // Agent 錯誤
  AGENT_NOT_FOUND = 'AGENT_NOT_FOUND',
  AGENT_CREATION_FAILED = 'AGENT_CREATION_FAILED',

  // Memory 錯誤
  BLOCK_NOT_FOUND = 'BLOCK_NOT_FOUND',
  CONTENT_TOO_LARGE = 'CONTENT_TOO_LARGE',

  // 搜尋錯誤
  SEARCH_FAILED = 'SEARCH_FAILED',

  // 其他
  UNKNOWN = 'UNKNOWN',
}

const ERROR_SUGGESTIONS: Record<LettaErrorCode, string> = {
  [LettaErrorCode.CONNECTION_FAILED]:
    '請檢查網路連線，或確認 Letta Cloud 服務是否正常',
  [LettaErrorCode.TIMEOUT]:
    'Letta 服務回應超時，請稍後再試',
  [LettaErrorCode.INVALID_API_KEY]:
    '請檢查 LETTA_API_KEY 環境變數是否正確設定',
  [LettaErrorCode.UNAUTHORIZED]:
    'API Key 無效或已過期，請重新取得',
  [LettaErrorCode.AGENT_NOT_FOUND]:
    'Agent 不存在，將自動初始化新的 Agent',
  [LettaErrorCode.AGENT_CREATION_FAILED]:
    '無法建立 Agent，請檢查 Letta 帳號配額',
  [LettaErrorCode.BLOCK_NOT_FOUND]:
    '指定的 Memory Block 不存在',
  [LettaErrorCode.CONTENT_TOO_LARGE]:
    '內容超過 Core Memory 限制，建議使用 memory_archive 存入 Archival Memory',
  [LettaErrorCode.SEARCH_FAILED]:
    '搜尋失敗，請稍後再試',
  [LettaErrorCode.UNKNOWN]:
    '發生未知錯誤，請檢查日誌',
};

export class LettaError extends Error {
  code: LettaErrorCode;
  suggestion: string;
  statusCode?: number;

  constructor(
    code: LettaErrorCode,
    message?: string,
    statusCode?: number
  ) {
    const defaultMessage = ERROR_SUGGESTIONS[code];
    super(message || defaultMessage);
    this.name = 'LettaError';
    this.code = code;
    this.suggestion = ERROR_SUGGESTIONS[code];
    this.statusCode = statusCode;
  }

  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      suggestion: this.suggestion,
      statusCode: this.statusCode,
    };
  }
}

/**
 * 從 HTTP 狀態碼判斷錯誤類型
 */
export function errorFromStatus(status: number, message?: string): LettaError {
  switch (status) {
    case 401:
      return new LettaError(LettaErrorCode.UNAUTHORIZED, message, status);
    case 403:
      return new LettaError(LettaErrorCode.INVALID_API_KEY, message, status);
    case 404:
      return new LettaError(LettaErrorCode.AGENT_NOT_FOUND, message, status);
    case 413:
      return new LettaError(LettaErrorCode.CONTENT_TOO_LARGE, message, status);
    case 408:
    case 504:
      return new LettaError(LettaErrorCode.TIMEOUT, message, status);
    default:
      return new LettaError(LettaErrorCode.UNKNOWN, message, status);
  }
}
