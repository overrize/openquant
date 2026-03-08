/**
 * 贵金属·原油行情：东方财富 push2 接口（国内期货/次主连）
 * - 沪金 113.aus 元/克、沪银 113.ags 元/千克、原油 142.scs 元/桶
 * - 无需 API Key，与 A 股同一套 push2 接口
 */
import { useEffect, useRef } from 'react'
import type { TickerRow } from '../types'
import { COMMODITY_NAMES } from '../types'

interface EastMoneyFuturesData {
  f43?: number
  f57?: string
  f58?: string
  f60?: number
  f169?: number
  f170?: number
  [key: string]: number | string | undefined
}

const API = 'https://push2.eastmoney.com/api/qt/stock/get'
const FIELDS = 'f43,f57,f58,f60,f169,f170'

/** 期货价格与 A 股一致：接口常为「放大 100 倍」，整数且范围 [100, 1e8] 时按分转元 */
function parsePriceYuan(v: number | undefined): number {
  if (v == null || Number.isNaN(v)) return 0
  const abs = Math.abs(v)
  if (Number.isInteger(v) && abs >= 100 && abs <= 1e8) return v / 100
  return v
}

export function useCommodityEastMoney(
  secids: string[],
  onQuotes: (updates: Partial<TickerRow>[]) => void,
  intervalMs = 8000
) {
  const onQuotesRef = useRef(onQuotes)
  const prevPricesRef = useRef<Record<string, number>>({})
  onQuotesRef.current = onQuotes

  useEffect(() => {
    if (secids.length === 0) return

    const fetchOne = async (secid: string): Promise<Partial<TickerRow> | null> => {
      try {
        const url = `${API}?secid=${encodeURIComponent(secid)}&fields=${FIELDS}`
        const res = await fetch(url)
        const json = await res.json()
        const data: EastMoneyFuturesData | undefined = json?.data
        if (!data) return null

        const price = parsePriceYuan(Number(data.f43))
        const prevClose = parsePriceYuan(Number(data.f60))
        const changeVal = prevClose > 0 && price >= 0 ? price - prevClose : (data.f169 != null ? parsePriceYuan(Number(data.f169)) : undefined)
        const rawPct = data.f170 != null ? Number(data.f170) : null
        const changePercent =
          rawPct != null
            ? (Math.abs(rawPct) <= 20 ? rawPct : rawPct / 100)
            : (prevClose && prevClose > 0 && changeVal != null ? (changeVal / prevClose) * 100 : undefined)

        const prev = prevPricesRef.current[secid]
        prevPricesRef.current[secid] = price
        const flash = prev != null && prev !== price ? (price > prev ? 'up' : 'down') : undefined

        const name = (data.f58 as string) || COMMODITY_NAMES[secid]

        return {
          id: `commodity-${secid}`,
          type: 'commodity',
          symbol: secid,
          name,
          price,
          prevClose: prevClose > 0 ? prevClose : undefined,
          change: changeVal,
          changePercent: changePercent != null ? Number(changePercent) : undefined,
          lastUpdate: Date.now(),
          flash,
        }
      } catch {
        return null
      }
    }

    const run = () => {
      Promise.all(secids.map(fetchOne)).then((results) => {
        const updates = results.filter((r): r is Partial<TickerRow> => r != null)
        if (updates.length) onQuotesRef.current(updates)
      })
    }

    run()
    const timer = setInterval(run, intervalMs)
    return () => clearInterval(timer)
  }, [secids.join(','), intervalMs])
}
