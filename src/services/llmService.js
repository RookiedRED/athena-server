const axios  = require('axios')
const config = require('../../config')

const ollamaClient = axios.create({
  baseURL: config.ollama.baseURL,
  timeout: 120000,
})

// 一般對話
const chat = async (messages, options = {}) => {
  const response = await ollamaClient.post('/api/chat', {
    model: options.model || config.ollama.model,
    messages,
    stream: false,
    options: {
      temperature: options.temperature || 0.7,
      num_predict: options.maxTokens   || 1024,
    },
  })
  return response.data.message.content
}

// 意圖識別（強制輸出 JSON）
const detectIntent = async (userInput, currentState) => {
  const systemPrompt = `你是 Athena 的意圖識別引擎，只能回傳 JSON，不能說任何其他話。

可用的 Tool：
- news:    查詢新聞    params: { "query": "關鍵字" }
- stock:   股票走勢    params: { "symbol": "2330.TW" }
- weather: 天氣       params: { "city": "台北" }
- sports:  球賽       params: { "query": "關鍵字" }
- chat:    一般對話    params: { "reply": "回應內容" }
- clear:   清空畫面    params: {}

回傳格式：
{ "tool": "tool名稱", "params": {}, "reply": "簡短口頭回應（選填）" }

只回傳 JSON，不要任何其他文字。`

  const messages = [
    { role: 'system', content: systemPrompt },
    {
      role: 'user',
      content: `當前畫面狀態：${JSON.stringify(currentState)}\n使用者說：「${userInput}」`,
    },
  ]

  const raw = await chat(messages, { temperature: 0.2, maxTokens: 256 })

  try {
    const clean = raw.replace(/```json|```/g, '').trim()
    const start = clean.indexOf('{')
    const end   = clean.lastIndexOf('}')
    return JSON.parse(clean.slice(start, end + 1))
  } catch {
    // 解析失敗 fallback 成普通對話
    return { tool: 'chat', params: { reply: raw }, reply: raw }
  }
}

// Streaming 推論（SSE）
const chatStream = async (messages, onChunk, options = {}) => {
  const response = await ollamaClient.post('/api/chat', {
    model: options.model || config.ollama.model,
    messages,
    stream: true,
  }, { responseType: 'stream' })

  return new Promise((resolve, reject) => {
    let fullText = ''
    response.data.on('data', (chunk) => {
      try {
        const lines = chunk.toString().split('\n').filter(Boolean)
        for (const line of lines) {
          const data  = JSON.parse(line)
          const token = data.message?.content || ''
          fullText   += token
          onChunk(token)
          if (data.done) resolve(fullText)
        }
      } catch { /* 忽略不完整的 chunk */ }
    })
    response.data.on('error', reject)
  })
}

module.exports = { chat, detectIntent, chatStream }
