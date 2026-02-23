# Athena Server

Athena 的後台伺服器，負責大 LLM 推論、API Key 管理、Token 驗證。

## 快速開始

### 1. 安裝依賴
```bash
npm install
```

### 2. 設定環境變數
```bash
cp .env.example .env
# 用任何編輯器打開 .env 填入你的設定
nano .env
```

### 3. 確認 Ollama 正在執行
```bash
ollama serve          # 啟動 Ollama
ollama pull llama3.1  # 下載模型（第一次）
```

### 4. 啟動伺服器
```bash
npm run dev   # 開發模式（自動重啟）
npm start     # 正式模式
```

---

## API 說明

### 取得 Token
```
POST /api/auth/token
Header: x-device-id: <你的裝置ID>

Response:
{
  "token": "eyJ...",
  "expiresAt": 1234567890000
}
```

### 刷新 Token
```
POST /api/auth/refresh
Header: x-device-id: <裝置ID>
Header: Authorization: Bearer <舊token>
```

### 意圖識別 + Tool 執行
```
POST /api/intent
Header: Authorization: Bearer <token>
Body: {
  "input": "今天有什麼新聞",
  "currentState": {}
}

Response:
{
  "intent": { "tool": "news", "params": { "query": "台灣" } },
  "data": [...新聞資料...],
  "processedAt": 1234567890000
}
```

### 串流對話（SSE）
```
POST /api/intent/chat
Header: Authorization: Bearer <token>
Body: { "messages": [{ "role": "user", "content": "你好" }] }

Response: text/event-stream
data: {"token": "你"}
data: {"token": "好"}
data: {"done": true}
```

---

## 架構

```
AthenaServer/
├── config/
│   └── index.js         ← 所有設定從 .env 讀取
├── src/
│   ├── index.js         ← Express App 進入點
│   ├── middleware/
│   │   └── auth.js      ← JWT + Device ID 驗證
│   ├── routes/
│   │   ├── auth.js      ← /api/auth/*
│   │   └── intent.js    ← /api/intent/*
│   └── services/
│       ├── llmService.js   ← Ollama 大 LLM
│       └── newsService.js  ← NewsAPI
└── .env                 ← 所有 API Key（不加入 git）
```
