const axios      = require('axios')
const config     = require('../../config')
const llmService = require('./llmService')

// 把任何格式的 LLM 輸出 normalize 成 [{index, point}]
const normalizePoints = (parsed, articles) => {
  return parsed
    .slice(0, articles.length)  // 不超過文章數
    .map((item, i) => {
      // 已經是正確格式 {index, point}
      if (item && typeof item === 'object' && typeof item.point === 'string') {
        return { index: item.index ?? i + 1, point: item.point.slice(0, 40) }
      }
      // 純字串陣列
      if (typeof item === 'string') {
        return { index: i + 1, point: item.slice(0, 40) }
      }
      // 其他奇怪格式：嘗試取任何字串值
      const text = Object.values(item).find(v => typeof v === 'string') || articles[i]?.title || ''
      return { index: i + 1, point: text.slice(0, 40) }
    })
    .filter(p => p.point.length > 0)
}

// 把新聞整合成一份結構化摘要
const summarizeAll = async (articles) => {
  // 只取前 6 篇，只用標題（不含 description），減少 token 數
  const top = articles.slice(0, 6)
  const articlesText = top.map((a, i) => `[${i + 1}] ${a.title}`).join('\n')

  const messages = [
    {
      role: 'system',
      content: 'You are a news summarizer. Read the following headlines and summarize each one in Traditional Chinese (繁體中文), maximum 25 characters per summary. Output ONLY a valid JSON array, nothing else. Example output: [{"index":1,"point":"蘋果發布新款 iPhone 17 系列"},{"index":2,"point":"台積電宣布擴大美國投資計畫"}]',
    },
    {
      role: 'user',
      content: `Summarize these headlines:\n${articlesText}`,
    },
  ]

  try {
    // timeout 縮短到 30 秒，避免拖太久
    const raw = await llmService.chat(messages, { temperature: 0.1, maxTokens: 300, timeout: 30000 })
    console.log('[News] LLM 摘要原始輸出:', raw.slice(0, 200))
    const clean = raw.replace(/```json|```/g, '').trim()
    const start = clean.indexOf('[')
    const end   = clean.lastIndexOf(']')
    if (start === -1 || end === -1) throw new Error('No JSON array found')
    return JSON.parse(clean.slice(start, end + 1))
  } catch (err) {
    console.error('[News] 摘要解析失敗:', err.message)
    // fallback：直接用標題
    return top.map((a, i) => ({
      index: i + 1,
      point: a.title.slice(0, 30),
    }))
  }
}

const fetch = async (query) => {
  if (!config.apiKeys.news) {
    console.error('[News] NEWS_API_KEY 未設定')
    return { points: [], articles: [] }
  }

  try {
    const { data } = await axios.get('https://newsapi.org/v2/everything', {
      params: {
        q:        query,
        language: 'zh',
        sortBy:   'publishedAt',
        pageSize: 10,
      },
      headers: { 'X-Api-Key': config.apiKeys.news },
      timeout: 10000,
    })

    const articles = data.articles || []
    console.log(`[News] 取得 ${articles.length} 篇，整合摘要中...`)

    const points = await summarizeAll(articles)
    console.log(`[News] 摘要完成，${points.length} 個重點`)

    return { points, articles }

  } catch (err) {
    console.error('[News] 錯誤:', err.response?.data || err.message)
    return { points: [], articles: [] }
  }
}

module.exports = { fetch }