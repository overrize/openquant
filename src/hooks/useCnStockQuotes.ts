import { useEffect, useRef } from 'react'
import type { TickerRow, CnStockSymbol } from '../types'

/** 东方财富 push2 个股行情接口返回的 data 字段（部分） */
interface EastMoneyStockData {
  f43?: number   // 最新价（部分接口为 *100）
  f44?: number
  f57?: number
  f58?: number   // 涨跌幅
  f60?: number   // 昨收
  f169?: number  // 涨跌额
  f170?: number  // 涨跌幅%
  f171?: number
  [key: string]: number | undefined
}

const EASTMONEY_API = 'https://push2.eastmoney.com/api/qt/stock/get'
/** 请求字段：最新价、昨收、涨跌额、涨跌幅 等 */
const FIELDS = 'f43,f44,f57,f58,f60,f169,f170,f171'

function parsePrice(v: number | undefined): number {
  if (v == null || Number.isNaN(v)) return 0
  if (Math.abs(v) > 1e6) return v / 100
  return v
}

export function useCnStockQuotes(
  symbols: CnStockSymbol[],
  onQuotes: (updates: Partial<TickerRow>[]) => void,
  intervalMs = 4000
) {
  const onQuotesRef = useRef(onQuotes)
  const prevPricesRef = useRef<Record<string, number>>({})
  onQuotesRef.current = onQuotes

  useEffect(() => {
    if (symbols.length === 0) return

    const fetchOne = async (s: CnStockSymbol): Promise<Partial<TickerRow> | null> => {
      try {
        const url = `${EASTMONEY_API}?secid=${encodeURIComponent(s.secid)}&fields=${FIELDS}`
        const res = await fetch(url)
        const json = await res.json()
        const data: EastMoneyStockData | undefined = json?.data
        if (!data) return null

        const rawPrice = data.f43 ?? data.f44 ?? data.f57
        const price = parsePrice(rawPrice)
        const prevClose = parsePrice(data.f60)
        const changePercent = data.f170 ?? data.f58
        const change = data.f169 ?? (prevClose ? price - prevClose : undefined)
        const prev = prevPricesRef.current[s.secid]
        prevPricesRef.current[s.secid] = price
        const flash = prev != null && prev !== price ? (price > prev ? 'up' : 'down') : undefined

        return {
          id: `cnstock-${s.secid}`,
          type: 'cnstock',
          symbol: s.code,
          name: s.name,
          price,
          prevClose: prevClose || undefined,
          change,
          changePercent: changePercent != null ? Number(changePercent) : undefined,
          lastUpdate: Date.now(),
          flash,
        }
      } catch {
        return null
      }
    }

    const run = () => {
      Promise.all(symbols.map(fetchOne)).then((results) => {
        const updates = results.filter((r): r is Partial<TickerRow> => r != null)
        if (updates.length) onQuotesRef.current(updates)
      })
    }

    run()
    const timer = setInterval(run, intervalMs)
    return () => clearInterval(timer)
  }, [symbols, intervalMs])
}
