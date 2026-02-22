/**
 * 大盘全局数据：A 股 / 美股 指数、市场情绪广度、行为经济学指标，轮询刷新
 */
import { useEffect, useState, useMemo } from 'react'
import {
  fetchCnIndexQuotes,
  fetchSentimentBreadth,
  computeBehaviorIndicators,
  type IndexQuote,
  type SentimentBreadth as SentimentType,
  type BehaviorIndicators as BehaviorType,
} from '../api/market'
import { useUsIndex } from './useUsIndex'

const INTERVAL_MS = 10_000

const DEFAULT_BEHAVIOR: BehaviorType = { herd: 50, anchor: 50, disposition: 50, attention: 50 }

export function useMarketOverview(enabled: boolean) {
  const [indices, setIndices] = useState<IndexQuote[]>([])
  const [sentiment, setSentiment] = useState<SentimentType | null>(null)
  const [behavior, setBehavior] = useState<BehaviorType>(DEFAULT_BEHAVIOR)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!enabled) return
    const run = async () => {
      setLoading(true)
      try {
        const [indexList, breadth] = await Promise.all([fetchCnIndexQuotes(), fetchSentimentBreadth()])
        setIndices(indexList)
        setSentiment(breadth)
        const mainIndex = indexList[0]
        const changePct = mainIndex?.changePercent ?? 0
        setBehavior(computeBehaviorIndicators(changePct, breadth))
      } catch {
        setIndices([])
        setSentiment(null)
      } finally {
        setLoading(false)
      }
    }

    run()
    const t = setInterval(run, INTERVAL_MS)
    return () => clearInterval(t)
  }, [enabled])

  return { indices, sentiment, behavior, loading }
}

/** 美股大盘：用 SPY 作为指数代理，无广度数据时仅由指数涨跌幅推算行为经济学指标 */
export function useMarketOverviewUs(apiKey: string | null, enabled: boolean) {
  const usIndex = useUsIndex(enabled ? apiKey : null)
  const indices: IndexQuote[] = useMemo(() => {
    if (!usIndex) return []
    return [
      {
        name: usIndex.name,
        secid: usIndex.symbol,
        price: usIndex.price,
        prevClose: usIndex.prevClose,
        change: usIndex.change,
        changePercent: usIndex.changePercent,
      },
    ]
  }, [usIndex])
  const sentiment = null
  const behavior = useMemo(
    () => computeBehaviorIndicators(usIndex?.changePercent ?? 0, null),
    [usIndex?.changePercent]
  )
  const loading = enabled && !!apiKey && !usIndex

  return { indices, sentiment, behavior, loading }
}
