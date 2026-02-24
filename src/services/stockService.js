const axios = require('axios')

// Yahoo Finance 非官方 API（免費，不需要 Key）
const fetch = async (symbol) => {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`
    const { data } = await axios.get(url, {
      params: { interval: '1d', range: '1mo' },
      headers: { 'User-Agent': 'Mozilla/5.0' },
      timeout: 10000,
    })

    const meta   = data.chart.result[0].meta
    const quotes = data.chart.result[0].indicators.quote[0]
    const timestamps = data.chart.result[0].timestamp

    return {
      symbol:        meta.symbol,
      price:         meta.regularMarketPrice,
      previousClose: meta.previousClose,
      change:        meta.regularMarketPrice - meta.previousClose,
      changePercent: ((meta.regularMarketPrice - meta.previousClose) / meta.previousClose) * 100,
      currency:      meta.currency,
      candles: timestamps.map((t, i) => ({
        time:   t,
        open:   quotes.open[i],
        high:   quotes.high[i],
        low:    quotes.low[i],
        close:  quotes.close[i],
        volume: quotes.volume[i],
      })).filter(c => c.close != null),
    }
  } catch (err) {
    console.error('StockService error:', err.message)
    return null
  }
}

module.exports = { fetch }