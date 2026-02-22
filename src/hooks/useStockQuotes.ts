import { useEffect, useRef } from 'react'
import type { TickerRow } from '../types'

/** Finnhub 免费版约 60 次/分钟，串行请求并间隔约 1.1 秒以不触发 429 */
const DELAY_BETWEEN_REQUESTS_MS = 1100

export function useStockQuotes(
  apiKey: string | null,
  symbols: string[],
  onQuotes: (updates: Partial<TickerRow>[]) => void
) {
  const onQuotesRef = useRef(onQuotes)
  onQuotesRef.current = onQuotes

  useEffect(() => {
    if (!apiKey || symbols.length === 0) return

    let cancelled = false

    const runRound = async () => {
      for (let i = 0; i < symbols.length; i++) {
        if (cancelled) return
        const s = symbols[i]
        try {
          const r = await fetch(
            `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(s)}&token=${apiKey}`
          )
          if (r.status === 429) {
            console.warn('[useStockQuotes] Finnhub 429 限流，请减少自选数量或稍后再试')
            break
          }
          const data = await r.json()
          const pc = data.pc as number
          const c = data.c as number
          const dp = data.dp as number
          if (!cancelled) {
            onQuotesRef.current([
              {
                id: `stock-${s}`,
                type: 'stock',
                symbol: s,
                price: c,
                prevClose: pc,
                changePercent: dp,
                change: c - pc,
                lastUpdate: Date.now(),
              },
            ])
          }
        } catch {
          // 单只失败不中断整轮
        }
        if (i < symbols.length - 1 && !cancelled) {
          await new Promise((r) => setTimeout(r, DELAY_BETWEEN_REQUESTS_MS))
        }
      }
    }

    const loop = async () => {
      while (!cancelled) {
        await runRound()
        if (cancelled) return
        await new Promise((r) => setTimeout(r, DELAY_BETWEEN_REQUESTS_MS))
      }
    }

    loop()
    return () => {
      cancelled = true
    }
  }, [apiKey, symbols.join(',')])
}
