const axios  = require('axios')
const config = require('../../config')

const ollamaClient = axios.create({
  baseURL: config.ollama.baseURL,
  timeout: 120000,
})

// 一般對話
const chat = async (messages, options = {}) => {
  const model = options.model || config.ollama.model
  console.log(`[LLM] 使用模型: ${model}`)

  const response = await ollamaClient.post('/api/chat', {
    model,
    messages,
    stream: false,
    options: {
      temperature: options.temperature ?? 0.7,
      num_predict: options.maxTokens   ?? 512,
    },
  }, {
    // 允許每個 call 自訂 timeout
    timeout: options.timeout ?? 120000,
  })
  return response.data.message.content
}

// 意圖識別（強制輸出 JSON）
const detectIntent = async (userInput, currentState) => {
  const systemPrompt = `You are Athena's intent engine. Reply ONLY with a single JSON object. No explanation, no markdown.

Available tools:
- news:    fetch news       params: { "query": "keyword" }
- stock:   stock price      params: { "symbol": "2330.TW" }
- weather: weather          params: { "city": "台北" }
- sports:  sports events    params: { "query": "keyword" }
- chat:    conversation     params: { "reply": "your response" }
- clear:   clear screen     params: {}

Output format (JSON only):
{"tool":"tool_name","params":{},"reply":"brief spoken response"}`

  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user',   content: `User said: "${userInput}"` },
  ]

  let raw = ''
  try {
    raw = await chat(messages, { temperature: 0.1, maxTokens: 128 })
    console.log(`[LLM] 原始輸出: ${raw}`)

    // 清理後解析
    const clean = raw.replace(/```json|```/g, '').trim()
    const start = clean.indexOf('{')
    const end   = clean.lastIndexOf('}')
    if (start === -1 || end === -1) throw new Error('No JSON found')
    return JSON.parse(clean.slice(start, end + 1))
  } catch (err) {
    console.error(`[LLM] 解析失敗: ${err.message}, raw: ${raw}`)
    return { tool: 'chat', params: { reply: raw || '我不太理解，可以換個說法嗎？' }, reply: raw }
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
          if (token) onChunk(token)
          if (data.done) resolve(fullText)
        }
      } catch { /* 忽略不完整 chunk */ }
    })
    response.data.on('error', reject)
  })
}

module.exports = { chat, detectIntent, chatStream }