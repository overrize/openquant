import { useEffect, useRef } from 'react'
import type { TickerRow } from '../types'

/** 拉取美股前收价等，用于计算涨跌幅 */
export function useStockQuotes(
  apiKey: string | null,
  symbols: string[],
  onQuotes: (updates: Partial<TickerRow>[]) => void
) {
  const onQuotesRef = useRef(onQuotes)
  onQuotesRef.current = onQuotes

  useEffect(() => {
    if (!apiKey || symbols.length === 0) return
    const abort = new AbortController()
    Promise.all(
      symbols.map((s) =>
        fetch(
          `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(s)}&token=${apiKey}`,
          { signal: abort.signal }
        ).then((r) => r.json())
      )
    ).then((results) => {
      const updates: Partial<TickerRow>[] = results.map((data, i) => {
        const symbol = symbols[i]
        const pc = data.pc as number
        const c = data.c as number
        const dp = data.dp as number
        return {
          id: `stock-${symbol}`,
          type: 'stock',
          symbol,
          price: c,
          prevClose: pc,
          changePercent: dp,
          change: c - pc,
          lastUpdate: Date.now(),
        }
      })
      onQuotesRef.current(updates)
    }).catch(() => {})
    return () => abort.abort()
  }, [apiKey, symbols.join(',')])
}
