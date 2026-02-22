/**
 * 美股大盘指数：用 SPY（标普500 ETF）作为代理，Finnhub quote
 */
import { useEffect, useState } from 'react'

const INTERVAL_MS = 15_000

export interface UsIndexQuote {
  name: string
  symbol: string
  price: number
  prevClose: number
  change: number
  changePercent: number
}

export function useUsIndex(apiKey: string | null) {
  const [quote, setQuote] = useState<UsIndexQuote | null>(null)

  useEffect(() => {
    if (!apiKey) {
      setQuote(null)
      return
    }
    const fetchQuote = async () => {
      try {
        const res = await fetch(
          `https://finnhub.io/api/v1/quote?symbol=SPY&token=${apiKey}`
        )
        const d = await res.json()
        const c = Number(d.c)
        const pc = Number(d.pc)
        if (c > 0 && pc > 0) {
          setQuote({
            name: '标普500(SPY)',
            symbol: 'SPY',
            price: c,
            prevClose: pc,
            change: c - pc,
            changePercent: ((c - pc) / pc) * 100,
          })
        }
      } catch {
        setQuote(null)
      }
    }
    fetchQuote()
    const t = setInterval(fetchQuote, INTERVAL_MS)
    return () => clearInterval(t)
  }, [apiKey])

  return quote
}
