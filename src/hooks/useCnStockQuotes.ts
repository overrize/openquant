/**
 * A 股行情：东方财富 push2 接口
 * - 价格单位：接口返回一般为「元」；若为「分」（1 元 = 100）则自动除以 100 转为元
 * - 字段：f43 最新价，f60 昨收，f170 涨跌幅（0.01% 为单位时需 /100）；涨跌额由 最新价-昨收 计算以保证与价格一致
 */
import { useEffect, useRef } from 'react'
import type { TickerRow, CnStockSymbol } from '../types'

/** api/qt/stock/get 返回的 data 字段（单位见文件头注释） */
interface EastMoneyStockData {
  f43?: number
  f60?: number
  f170?: number
  [key: string]: number | undefined
}

const EASTMONEY_API = 'https://push2.eastmoney.com/api/qt/stock/get'
const FIELDS = 'f43,f60,f170'

/**
 * 解析价格/涨跌额：东方财富 push2 接口常返回「分」（1 元 = 100 分）。
 * 整数且在合理范围 [100, 1e8] 时按分转元；否则按元使用。
 */
function parsePriceYuan(v: number | undefined): number {
  if (v == null || Number.isNaN(v)) return 0
  const abs = Math.abs(v)
  if (Number.isInteger(v) && abs >= 100 && abs <= 1e8) return v / 100
  return v
}

/** A 股轮询间隔默认 8 秒（频率低于美股） */
export function useCnStockQuotes(
  symbols: CnStockSymbol[],
  onQuotes: (updates: Partial<TickerRow>[]) => void,
  intervalMs = 8000
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

        const price = parsePriceYuan(data.f43)
        const prevClose = parsePriceYuan(data.f60)
        // 涨跌额统一用「最新价 - 昨收」，与价格单位一致，避免 f169 单位歧义（分/元混用）导致显示错误
        const changeVal = prevClose != null && price > 0 ? price - prevClose : undefined
        const rawPct = data.f170 != null ? Number(data.f170) : null
        // f170 与指数一致：接口常为 0.01% 为单位（如 250 表示 2.5%）；绝对值≤20 时视为已是百分比
        const changePercentVal =
          rawPct != null
            ? (Math.abs(rawPct) <= 20 ? rawPct : rawPct / 100)
            : (prevClose && prevClose > 0 && changeVal != null ? (changeVal / prevClose) * 100 : undefined)
        const prev = prevPricesRef.current[s.secid]
        prevPricesRef.current[s.secid] = price
        const flash = prev != null && prev !== price ? (price > prev ? 'up' : 'down') : undefined

        return {
          id: `cnstock-${s.secid}`,
          type: 'cnstock',
          symbol: s.code,
          name: s.name,
          price,
          prevClose: prevClose > 0 ? prevClose : undefined,
          change: changeVal,
          changePercent: changePercentVal != null ? Number(changePercentVal) : undefined,
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
