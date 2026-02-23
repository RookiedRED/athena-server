const express = require('express')
const jwt     = require('jsonwebtoken')
const config  = require('../../config')
const { authenticateDevice } = require('../middleware/auth')

const router = express.Router()

// POST /api/auth/token
// 手機第一次啟動，用 device ID 換取 JWT token
router.post('/token', authenticateDevice, (req, res) => {
  const token = jwt.sign(
    { deviceId: req.deviceId, issuedAt: Date.now() },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn }
  )

  const decoded = jwt.decode(token)

  res.json({
    token,
    expiresAt: decoded.exp * 1000,
  })
})

// POST /api/auth/refresh
// Token 快過期時換新的
router.post('/refresh', authenticateDevice, (req, res) => {
  const authHeader = req.headers['authorization']
  const oldToken   = authHeader && authHeader.split(' ')[1]

  if (!oldToken) {
    return res.status(401).json({ error: 'Missing token' })
  }

  try {
    const decoded = jwt.verify(oldToken, config.jwtSecret, { ignoreExpiration: true })
    const newToken = jwt.sign(
      { deviceId: decoded.deviceId, issuedAt: Date.now() },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn }
    )
    const newDecoded = jwt.decode(newToken)
    res.json({ token: newToken, expiresAt: newDecoded.exp * 1000 })
  } catch {
    res.status(403).json({ error: 'Invalid token' })
  }
})

module.exports = router
