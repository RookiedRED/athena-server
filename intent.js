const express = require('express')
const { authenticateToken } = require('../middleware/auth')
const llmService = require('../services/llmService')
const newsService = require('../services/newsService')

const router = express.Router()

// ── POST /intent ────────────────────────────────────────
// 手機傳來使用者輸入，後台大 LLM 判斷意圖並執行 Tool，回傳結果
router.post('/', authenticateToken, async (req, res) => {
  const { input, currentState } = req.body

  if (!input) {
    return res.status(400).json({ error: 'Missing input' })
  }

  try {
    // 1. 大 LLM 判斷意圖
    const intent = await llmService.detectIntent(input, currentState || {})
    console.log(`[${req.device.deviceId}] intent:`, intent)

    // 2. 執行對應 Tool
    let data = null

    switch (intent.tool) {
      case 'news': {
        const query = intent.params?.query || '台灣'
        data = await newsService.fetch(query)
        break
      }
      case 'stock': {
        // Stock 資料直接讓手機去抓（Yahoo Finance 不需要 Key）
        // 這裡只回傳 intent，手機自己查
        break
      }
      case 'weather':
      case 'sports':
      case 'chat':
      case 'clear':
      default:
        break
    }

    // 3. 回傳意圖 + 資料
    res.json({
      intent,
      data,
      processedAt: Date.now(),
    })

  } catch (err) {
    console.error('Intent error:', err.message)
    res.status(500).json({ error: 'LLM processing failed', detail: err.message })
  }
})

// ── POST /intent/chat ───────────────────────────────────
// 純對話，支援 streaming（SSE）
router.post('/chat', authenticateToken, async (req, res) => {
  const { messages } = req.body

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Missing messages' })
  }

  // SSE headers
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')

  try {
    await llmService.chatStream(
      messages,
      (token) => {
        res.write(`data: ${JSON.stringify({ token })}\n\n`)
      }
    )
    res.write(`data: ${JSON.stringify({ done: true })}\n\n`)
    res.end()
  } catch (err) {
    res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`)
    res.end()
  }
})

module.exports = router
