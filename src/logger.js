// MARK: - 請求/回應監聽 Middleware

const logger = (req, res, next) => {
  const start = Date.now()
  const time  = new Date().toISOString()

  // 印出請求
  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
  console.log(`📥 [${time}]`)
  console.log(`   ${req.method} ${req.originalUrl}`)
  if (req.headers['x-device-id']) {
    console.log(`   Device: ${req.headers['x-device-id']}`)
  }
  if (req.body && Object.keys(req.body).length > 0) {
    console.log(`   Body:   ${JSON.stringify(req.body)}`)
  }

  // 攔截 res.json 印出回應
  const originalJson = res.json.bind(res)
  res.json = (data) => {
    const ms = Date.now() - start
    console.log(`📤 [${ms}ms] Status: ${res.statusCode}`)
    // 回應太長只印前 500 字
    const preview = JSON.stringify(data)
    console.log(`   Body:   ${preview.length > 500 ? preview.slice(0, 500) + '...' : preview}`)
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`)
    return originalJson(data)
  }

  next()
}

module.exports = logger