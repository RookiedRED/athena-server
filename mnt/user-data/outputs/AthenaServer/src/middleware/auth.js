const jwt = require('jsonwebtoken')
const config = require('../../config')

// ── 驗證 JWT Token ──────────────────────────────────────
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1] // Bearer <token>

  if (!token) {
    return res.status(401).json({ error: 'Missing token' })
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret)
    req.device = decoded   // 把裝置資訊掛到 req 上
    next()
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired token' })
  }
}

// ── 驗證裝置 ID 是否在白名單 ────────────────────────────
const authenticateDevice = (req, res, next) => {
  const deviceId = req.headers['x-device-id']

  if (!deviceId) {
    return res.status(401).json({ error: 'Missing device ID' })
  }

  // 如果有設定白名單才做驗證，沒設定就全部放行（開發時方便）
  if (config.allowedDeviceIds.length > 0 && !config.allowedDeviceIds.includes(deviceId)) {
    return res.status(403).json({ error: 'Device not authorized' })
  }

  req.deviceId = deviceId
  next()
}

module.exports = { authenticateToken, authenticateDevice }
