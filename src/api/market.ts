/**
 * 大盘数据：A 股指数、市场情绪广度、行为经济学指标（由指数与情绪推导）
 */

const EASTMONEY_QUOTE = 'https://push2.eastmoney.com/api/qt/stock/get'

function parsePriceYuan(v: number | undefined): number {
  if (v == null || Number.isNaN(v)) return 0
  const abs = Math.abs(v)
  if (Number.isInteger(v) && abs >= 100 && abs <= 1e8) return v / 100
  return v
}

/** 上证指数 1.000001、深证成指 0.399001 */
export interface IndexQuote {
  name: string
  secid: string
  price: number
  prevClose: number
  change: number
  changePercent: number
}

export async function fetchCnIndexQuotes(): Promise<IndexQuote[]> {
  const list = [
    { secid: '1.000001', name: '上证指数' },
    { secid: '0.399001', name: '深证成指' },
  ]
  const results = await Promise.all(
    list.map(async ({ secid, name }) => {
      try {
        const res = await fetch(
          `${EASTMONEY_QUOTE}?secid=${encodeURIComponent(secid)}&fields=f43,f60,f169,f170`
        )
        const json = await res.json()
        const d = json?.data
        if (!d) return null
        const price = parsePriceYuan(d.f43)
        const prevClose = parsePriceYuan(d.f60)
        const change = d.f169 != null ? parsePriceYuan(d.f169) : price - prevClose
        const changePercent = d.f170 ?? (prevClose ? (change / prevClose) * 100 : 0)
        return { name, secid, price, prevClose, change, changePercent }
      } catch {
        return null
      }
    })
  )
  return results.filter((r): r is IndexQuote => r != null)
}

/** 市场情绪广度（上涨/平盘/下跌家数等），当前为估算值，后续可接真实接口 */
export interface SentimentBreadth {
  up: number
  flat: number
  down: number
  limitUp: number
  limitDown: number
  total: number
}

/** 东方财富 沪深京 A 股涨跌分布（若有）或根据指数变化估算 */
export async function fetchSentimentBreadth(): Promise<SentimentBreadth | null> {
  try {
    const url =
      'https://datacenter-web.eastmoney.com/api/data/v1/get?reportName=RPT_EXCHANGE_RISEFALL_STAT&pageSize=1&pageNumber=1&sortColumns=STAT_DATE&sortTypes=-1&columns=STAT_DATE,UP_NUM,DOWN_NUM,EQUAL_NUM,LIMIT_UP_NUM,LIMIT_DOWN_NUM'
    const res = await fetch(url)
    const json = await res.json()
    const list = json?.data
    if (list && list.length > 0) {
      const row = list[0]
      const up = Number(row.UP_NUM) || 0
      const down = Number(row.DOWN_NUM) || 0
      const flat = Number(row.EQUAL_NUM) || 0
      const limitUp = Number(row.LIMIT_UP_NUM) || 0
      const limitDown = Number(row.LIMIT_DOWN_NUM) || 0
      const total = up + flat + down
      if (total > 0) return { up, flat, down, limitUp, limitDown, total }
    }
  } catch {}
  return null
}

/**
 * 行为经济学指标（0–100）
 * 公式说明（与界面“计算说明”一致）：
 * - 羊群 herd = 50 + (上涨家数占比 - 0.5)*100。无广度数据时=50。
 *   含义：涨跌越一边倒(全涨→100/全跌→0)越跟风，越各半(50)越分化。
 * - 锚定 anchor = 50 - |指数日涨跌幅%|*3。仅依赖指数，总有值。
 *   含义：波动大→锚定被打破(低)，波动小→仍依赖参考点(高)。
 * - 处置 disposition = 涨停/(涨停+跌停)*100。无涨停跌停时=50。
 * - 注意力 attention = 上涨家数占比*100。无广度时=50。
 */
export interface BehaviorIndicators {
  herd: number
  anchor: number
  disposition: number
  attention: number
}

export function computeBehaviorIndicators(
  indexChangePercent: number,
  sentiment: SentimentBreadth | null
): BehaviorIndicators {
  let herd = 50
  let anchor = 50
  let disposition = 50
  let attention = 50

  if (sentiment && sentiment.total > 0) {
    const upRatio = sentiment.up / sentiment.total
    herd = Math.round(50 + (upRatio - 0.5) * 100)
    const limitTotal = sentiment.limitUp + sentiment.limitDown
    const limitRatio = limitTotal > 0 ? sentiment.limitUp / limitTotal : 0.5
    disposition = Math.round(limitRatio * 100)
    attention = Math.round(upRatio * 100)
  }

  anchor = Math.round(50 - Math.abs(indexChangePercent) * 3)

  herd = Math.max(0, Math.min(100, herd))
  anchor = Math.max(0, Math.min(100, anchor))
  disposition = Math.max(0, Math.min(100, disposition))
  attention = Math.max(0, Math.min(100, attention))

  return { herd, anchor, disposition, attention }
}
