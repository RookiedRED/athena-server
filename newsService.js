const axios  = require('axios')
const config = require('../../config')

const newsClient = axios.create({
  baseURL: 'https://newsapi.org/v2',
  timeout: 10000,
  headers: { 'X-Api-Key': config.apiKeys.news },
})

const fetch = async (query) => {
  try {
    const { data } = await newsClient.get('/everything', {
      params: { q: query, language: 'zh', sortBy: 'publishedAt', pageSize: 10 },
    })
    return data.articles || []
  } catch (err) {
    console.error('NewsAPI error:', err.message)
    return []
  }
}

const topHeadlines = async (country = 'tw') => {
  try {
    const { data } = await newsClient.get('/top-headlines', {
      params: { country, pageSize: 10 },
    })
    return data.articles || []
  } catch (err) {
    console.error('NewsAPI headlines error:', err.message)
    return []
  }
}

module.exports = { fetch, topHeadlines }
