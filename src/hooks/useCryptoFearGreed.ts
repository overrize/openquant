/**
 * 加密货币恐慌贪婪指数，仅在选择加密货币标签时拉取（Alternative.me 更新频率约数小时）
 */
import { useEffect, useState } from 'react'
import { fetchCryptoFearGreed, type FearGreedResult } from '../api/cryptoSentiment'

const INTERVAL_MS = 60_000 * 5 // 5 分钟

export function useCryptoFearGreed(enabled: boolean) {
  const [data, setData] = useState<FearGreedResult | null>(null)

  useEffect(() => {
    if (!enabled) return
    const run = async () => {
      const result = await fetchCryptoFearGreed()
      setData(result)
    }
    run()
    const t = setInterval(run, INTERVAL_MS)
    return () => clearInterval(t)
  }, [enabled])

  return data
}
