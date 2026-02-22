/**
 * 加密货币行为经济学指标与市场数据
 * - 恐慌贪婪指数（Alternative.me）
 * - RSI（自算，Binance K 线）
 * - 山寨币季节指数（自算：市值主流币相对 BTC 的 90 日表现）
 */

const FNG_API = 'https://api.alternative.me/fng/?limit=1'
const BINANCE_KLINES = 'https://api.binance.com/api/v3/klines'

/** 从日 K 收盘价计算 RSI(14)，需至少 15 根 K 线 */
export function computeRSI(closes: number[], period = 14): number | null {
  if (closes.length < period + 1) return null
  let avgGain = 0
  let avgLoss = 0
  for (let i = closes.length - period; i < closes.length; i++) {
    const ch = closes[i]! - closes[i - 1]!
    if (ch > 0) avgGain += ch
    else avgLoss -= ch
  }
  avgGain /= period
  avgLoss /= period
  if (avgLoss === 0) return 100
  const rs = avgGain / avgLoss
  const rsi = 100 - 100 / (1 + rs)
  return Math.round(rsi * 10) / 10
}

export interface RsiItem {
  symbol: string
  rsi: number | null
}

/** 拉取多币种日 K 并计算 RSI(14) */
export async function fetchCryptoRSI(symbols: string[]): Promise<RsiItem[]> {
  const period = 14
  const limit = period + 2
  const results = await Promise.all(
    symbols.map(async (symbol): Promise<RsiItem> => {
      try {
        const res = await fetch(
          `${BINANCE_KLINES}?symbol=${encodeURIComponent(symbol)}&interval=1d&limit=${limit}`
        )
        const arr = await res.json()
        if (!Array.isArray(arr) || arr.length < period + 1) return { symbol, rsi: null }
        const closes = arr.map((c: (string | number)[]) => Number(c[4]))
        const rsi = computeRSI(closes, period)
        return { symbol, rsi }
      } catch {
        return { symbol, rsi: null }
      }
    })
  )
  return results
}

/** 山寨币季节指数：统计多少比例的主流山寨 90 日收益跑赢 BTC，>75 为山寨季，<25 为比特币季 */
const ALTS_FOR_SEASON = ['ETHUSDT', 'BNBUSDT', 'SOLUSDT', 'XRPUSDT', 'DOGEUSDT', 'ADAUSDT', 'AVAXUSDT', 'LINKUSDT']

export async function fetchAltcoinSeasonIndex(): Promise<number | null> {
  try {
    const resBtc = await fetch(
      `${BINANCE_KLINES}?symbol=BTCUSDT&interval=1d&limit=92`
    )
    const btcArr = await resBtc.json()
    if (!Array.isArray(btcArr) || btcArr.length < 2) return null
    const btcFirst = Number(btcArr[0]?.[4])
    const btcLast = Number(btcArr[btcArr.length - 1]?.[4])
    if (!btcFirst || !btcLast) return null
    const btcReturn = (btcLast - btcFirst) / btcFirst

    let beatCount = 0
    for (const sym of ALTS_FOR_SEASON) {
      try {
        const res = await fetch(
          `${BINANCE_KLINES}?symbol=${encodeURIComponent(sym)}&interval=1d&limit=92`
        )
        const arr = await res.json()
        if (!Array.isArray(arr) || arr.length < 2) continue
        const first = Number(arr[0]?.[4])
        const last = Number(arr[arr.length - 1]?.[4])
        if (!first || !last) continue
        const ret = (last - first) / first
        if (ret > btcReturn) beatCount++
      } catch {
        // skip
      }
    }
    const index = Math.round((beatCount / ALTS_FOR_SEASON.length) * 100)
    return Math.max(0, Math.min(100, index))
  } catch {
    return null
  }
}

export interface FearGreedResult {
  value: number       // 0-100
  classification: string  // 如 "Extreme Fear", "Greed"
}

export async function fetchCryptoFearGreed(): Promise<FearGreedResult | null> {
  try {
    const res = await fetch(FNG_API)
    const json = await res.json()
    const data = json?.data?.[0]
    if (!data) return null
    const value = parseInt(String(data.value), 10)
    if (Number.isNaN(value)) return null
    return {
      value: Math.max(0, Math.min(100, value)),
      classification: String(data.value_classification || ''),
    }
  } catch {
    return null
  }
}
