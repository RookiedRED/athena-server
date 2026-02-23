const jwt    = require('jsonwebtoken')
const config = require('../../config')

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if (!token) {
    return res.status(401).json({ error: 'Missing token' })
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret)
    req.device = decoded
    next()
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired token' })
  }
}

const authenticateDevice = (req, res, next) => {
  const deviceId = req.headers['x-device-id']

  if (!deviceId) {
    return res.status(401).json({ error: 'Missing device ID' })
  }

  if (config.allowedDeviceIds.length > 0 && !config.allowedDeviceIds.includes(deviceId)) {
    return res.status(403).json({ error: 'Device not authorized' })
  }

  req.deviceId = deviceId
  next()
}

module.exports = { authenticateToken, authenticateDevice }
