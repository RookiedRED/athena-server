const axios      = require('axios')
const config     = require('../../config')
const llmService = require('./llmService')

// 把 10 篇新聞整合成一份結構化摘要
const summarizeAll = async (articles) => {
  const articlesText = articles.map((a, i) =>
    `[${i + 1}] ${a.title}${a.description ? '\n' + a.description : ''}`
  ).join('\n\n')

  const messages = [
    {
      role: 'system',
      content: `你是新聞摘要助手。
閱讀以下新聞後，用繁體中文整理出 5～6 個最重要的重點。
每個重點對應一篇新聞，格式如下（只輸出 JSON，不要其他文字）：

[
  { "index": 1, "point": "重點一句話（不超過 30 字）" },
  { "index": 2, "point": "重點一句話（不超過 30 字）" }
]

index 是對應的新聞編號，point 是該篇的核心重點。`,
    },
    {
      role: 'user',
      content: articlesText,
    },
  ]

  try {
    const raw   = await llmService.chat(messages, { temperature: 0.2, maxTokens: 400 })
    const clean = raw.replace(/```json|```/g, '').trim()
    const start = clean.indexOf('[')
    const end   = clean.lastIndexOf(']')
    return JSON.parse(clean.slice(start, end + 1))
  } catch (err) {
    console.error('[News] 摘要解析失敗:', err.message)
    // fallback：直接用標題
    return articles.slice(0, 6).map((a, i) => ({
      index: i + 1,
      point: a.title.slice(0, 40),
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