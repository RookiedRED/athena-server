require('dotenv').config({ path: require('path').join(__dirname, '../../.env') })

module.exports = {
  port: process.env.PORT || 3000,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  ollama: {
    baseURL: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
    model:   process.env.OLLAMA_MODEL   || 'llama3.1',
  },
  apiKeys: {
    news: process.env.NEWS_API_KEY,
  },
  allowedDeviceIds: (process.env.ALLOWED_DEVICE_IDS || '').split(',').filter(Boolean),
}
