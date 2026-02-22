/**
 * 加密货币情绪与市场指标：恐慌贪婪、RSI 热力图、山寨币季节指数
 */
import { useEffect, useState } from 'react'
import {
  fetchCryptoFearGreed,
  fetchCryptoRSI,
  fetchAltcoinSeasonIndex,
  type FearGreedResult,
  type RsiItem,
} from '../api/cryptoSentiment'

const FNG_INTERVAL_MS = 60_000 * 5
const RSI_INTERVAL_MS = 60_000 * 2
const ALTSEASON_INTERVAL_MS = 60_000 * 10

export function useCryptoFearGreed(enabled: boolean) {
  const [data, setData] = useState<FearGreedResult | null>(null)

  useEffect(() => {
    if (!enabled) return
    const run = async () => {
      const result = await fetchCryptoFearGreed()
      setData(result)
    }
    run()
    const t = setInterval(run, FNG_INTERVAL_MS)
    return () => clearInterval(t)
  }, [enabled])

  return data
}

export function useCryptoRSI(symbols: string[], enabled: boolean): RsiItem[] {
  const [data, setData] = useState<RsiItem[]>([])

  useEffect(() => {
    if (!enabled || symbols.length === 0) {
      setData([])
      return
    }
    const run = async () => {
      const list = await fetchCryptoRSI(symbols)
      setData(list)
    }
    run()
    const t = setInterval(run, RSI_INTERVAL_MS)
    return () => clearInterval(t)
  }, [enabled, symbols.join(',')])

  return data
}

export function useAltcoinSeasonIndex(enabled: boolean): number | null {
  const [index, setIndex] = useState<number | null>(null)

  useEffect(() => {
    if (!enabled) return
    const run = async () => {
      const v = await fetchAltcoinSeasonIndex()
      setIndex(v)
    }
    run()
    const t = setInterval(run, ALTSEASON_INTERVAL_MS)
    return () => clearInterval(t)
  }, [enabled])

  return index
}
