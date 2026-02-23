const express     = require('express')
const { authenticateToken } = require('../middleware/auth')
const llmService  = require('../services/llmService')
const newsService = require('../services/newsService')

const router = express.Router()

// POST /api/intent
// 手機傳來使用者輸入 → 大 LLM 判斷意圖 → 執行 Tool → 回傳結果
router.post('/', authenticateToken, async (req, res) => {
  const { input, currentState } = req.body

  if (!input) {
    return res.status(400).json({ error: 'Missing input' })
  }

  try {
    // 1. 大 LLM 判斷意圖
    const intent = await llmService.detectIntent(input, currentState || {})
    console.log(`[${req.device.deviceId}] intent: ${JSON.stringify(intent)}`)

    // 2. 執行對應 Tool
    let data = null

    switch (intent.tool) {
      case 'news': {
        const query = intent.params?.query || '台灣'
        data = await newsService.fetch(query)
        break
      }
      case 'stock':
        // Stock 讓手機直接查 Yahoo Finance（不需要 Key）
        // 這裡只回傳 intent，手機自己處理
        break
      case 'weather':
      case 'sports':
      case 'chat':
      case 'clear':
      default:
        break
    }

    res.json({
      intent,
      data,
      processedAt: Date.now(),
    })

  } catch (err) {
    console.error('Intent error:', err.message)
    res.status(500).json({ error: 'Processing failed', detail: err.message })
  }
})

// POST /api/intent/chat  （串流對話，SSE）
router.post('/chat', authenticateToken, async (req, res) => {
  const { messages } = req.body

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Missing messages' })
  }

  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')

  try {
    await llmService.chatStream(messages, (token) => {
      res.write(`data: ${JSON.stringify({ token })}\n\n`)
    })
    res.write(`data: ${JSON.stringify({ done: true })}\n\n`)
    res.end()
  } catch (err) {
    res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`)
    res.end()
  }
})

module.exports = router
