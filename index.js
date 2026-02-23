const express = require('express')
const helmet = require('helmet')
const cors = require('cors')
const rateLimit = require('express-rate-limit')
const config = require('../config')

const authRouter   = require('./routes/auth')
const intentRouter = require('./routes/intent')

const app = express()

// ── 基礎安全設定 ────────────────────────────────────────
app.use(helmet())
app.use(cors({
  // 只接受你自己的 IP 或域名，* 僅限開發用
  origin: process.env.NODE_ENV === 'development' ? '*' : process.env.ALLOWED_ORIGINS,
}))
app.use(express.json({ limit: '1mb' }))

// ── Rate Limiting（防止濫用）────────────────────────────
const limiter = rateLimit({
  windowMs: 60 * 1000,   // 1 分鐘
  max: 30,               // 每個 IP 最多 30 次請求
  message: { error: 'Too many requests, slow down' },
})
app.use('/api', limiter)

// ── 路由 ─────────────────────────────────────────────────
app.use('/api/auth',   authRouter)
app.use('/api/intent', intentRouter)

// ── 健康檢查 ─────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() })
})

// ── 啟動 ──────────────────────────────────────────────────
app.listen(config.port, () => {
  console.log(`
  ┌────────────────────────────────────┐
  │   Athena Server                    │
  │   Running on port ${String(config.port).padEnd(16)}│
  │   ENV: ${(process.env.NODE_ENV || 'development').padEnd(27)}│
  └────────────────────────────────────┘
  `)
})
