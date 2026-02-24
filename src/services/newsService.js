const axios  = require('axios')
const config = require('../../config')

const fetch = async (query) => {
  if (!config.apiKeys.news) {
    console.error('[News] NEWS_API_KEY 未設定')
    return []
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

    console.log(`[News] 取得 ${data.articles?.length || 0} 篇文章，query: ${query}`)
    return data.articles || []

  } catch (err) {
    console.error('[News] 錯誤:', err.response?.data || err.message)
    return []
  }
}

const topHeadlines = async (country = 'tw') => {
  if (!config.apiKeys.news) return []

  try {
    const { data } = await axios.get('https://newsapi.org/v2/top-headlines', {
      params: { country, pageSize: 10 },
      headers: { 'X-Api-Key': config.apiKeys.news },
      timeout: 10000,
    })
    return data.articles || []
  } catch (err) {
    console.error('[News] topHeadlines 錯誤:', err.response?.data || err.message)
    return []
  }
}

module.exports = { fetch, topHeadlines }