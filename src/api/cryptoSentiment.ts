/**
 * 加密货币行为经济学指标：恐慌贪婪指数（Alternative.me 免费 API）
 * 0=极度恐慌，100=极度贪婪，综合波动率、成交量、社交媒体、比特币占比等
 */

const FNG_API = 'https://api.alternative.me/fng/?limit=1'

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
