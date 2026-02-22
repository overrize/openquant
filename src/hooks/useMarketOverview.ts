/**
 * 大盘全局数据：A 股指数、市场情绪广度、行为经济学指标，轮询刷新
 */
import { useEffect, useState } from 'react'
import {
  fetchCnIndexQuotes,
  fetchSentimentBreadth,
  computeBehaviorIndicators,
  type IndexQuote,
  type SentimentBreadth as SentimentType,
  type BehaviorIndicators as BehaviorType,
} from '../api/market'

const INTERVAL_MS = 10_000

export function useMarketOverview(enabled: boolean) {
  const [indices, setIndices] = useState<IndexQuote[]>([])
  const [sentiment, setSentiment] = useState<SentimentType | null>(null)
  const [behavior, setBehavior] = useState<BehaviorType>({ herd: 50, anchor: 50, disposition: 50, attention: 50 })
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
