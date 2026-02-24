const express   = require('express')
const helmet    = require('helmet')
const cors      = require('cors')
const rateLimit = require('express-rate-limit')
const config    = require('../config')

const logger       = require('./middleware/logger')
const authRouter   = require('./routes/auth')
const intentRouter = require('./routes/intent')

const app = express()

// 請求監聽
app.use(logger)

// 安全設定
app.use(helmet())
app.use(cors())
app.use(express.json({ limit: '1mb' }))

// Rate Limiting（每分鐘最多 30 次請求）
app.use('/api', rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: { error: 'Too many requests' },
}))

// 路由
app.use('/api/auth',   authRouter)
app.use('/api/intent', intentRouter)

// 健康檢查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() })
})

// 啟動
app.listen(config.port, () => {
  console.log(`
  ┌─────────────────────────────┐
  │   Athena Server             │
  │   Port: ${String(config.port).padEnd(20)}│
  │   ENV:  ${(process.env.NODE_ENV || 'development').padEnd(20)}│
  └─────────────────────────────┘
  `)
})