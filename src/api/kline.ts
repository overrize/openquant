/**
 * K 线数据接口：美股(Finnhub)、A股(东方财富)、加密货币(Binance)
 * 统一返回 { time, open, high, low, close }[]
 * time：日 K 为 YYYY-MM-DD 字符串；分时（1m/5m 等）为 Unix 秒（number）
 */

export interface KlineBar {
  time: string | number
  open: number
  high: number
  low: number
  close: number
}

/** Yahoo chart API 单条 result 结构 */
interface YahooChartResult {
  timestamp?: number[]
  indicators?: { quote?: Array<{ open?: number[]; high?: number[]; low?: number[]; close?: number[] }> }
}

/** Binance 支持的 K 线周期 */
export type BinanceKlineInterval = '1m' | '5m' | '15m' | '1h' | '4h' | '1d' | '1w'

const LOG = true
function logKline(tag: string, ...args: unknown[]) {
  if (LOG) console.log(`[Kline ${tag}]`, ...args)
}

/** 美股日 K：Finnhub（免费版可能无 candle 或限流，返回空时用 Yahoo 备用） */
export async function fetchUSKline(
  symbol: string,
  apiKey: string,
  limit = 120
): Promise<KlineBar[]> {
  const end = Math.floor(Date.now() / 1000)
  const start = end - limit * 86400
  const url = `https://finnhub.io/api/v1/stock/candle?symbol=${encodeURIComponent(symbol)}&resolution=D&from=${start}&to=${end}&token=${apiKey}`
  logKline('Finnhub', 'request', { symbol, url: url.replace(apiKey, '***') })
  try {
    const res = await fetch(url)
    logKline('Finnhub', 'response', { symbol, status: res.status, ok: res.ok })
    const data = await res.json()
    if (data.s === 'no_data' || !data.t || !Array.isArray(data.t) || data.t.length === 0) {
      logKline('Finnhub', 'empty or no_data', { symbol, s: data.s, tLen: data.t?.length })
      return []
    }
    const o = (data.o ?? []) as number[]
    const h = (data.h ?? []) as number[]
    const l = (data.l ?? []) as number[]
    const c = (data.c ?? []) as number[]
    const bars = data.t.map((t: number, i: number) => ({
      time: new Date(t * 1000).toISOString().slice(0, 10),
      open: o[i] ?? 0,
      high: h[i] ?? 0,
      low: l[i] ?? 0,
      close: c[i] ?? 0,
    }))
    logKline('Finnhub', 'ok', { symbol, bars: bars.length })
    return bars
  } catch (e) {
    logKline('Finnhub', 'error', { symbol, err: e, message: e instanceof Error ? e.message : e })
    throw e
  }
}

/** 美股日 K：Alpha Vantage（免费 25 次/天，需 Key，见 alphavantage.co） */
export async function fetchUSKlineAlphaVantage(
  symbol: string,
  apiKey: string,
  limit = 120
): Promise<KlineBar[]> {
  const url = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${encodeURIComponent(symbol)}&outputsize=compact&apikey=${encodeURIComponent(apiKey)}`
  logKline('AlphaVantage', 'request', { symbol })
  try {
    const res = await fetch(url)
    const json = await res.json()
    const errMsg = json['Error Message'] as string | undefined
    const note = json['Note'] as string | undefined
    if (errMsg || note) {
      logKline('AlphaVantage', 'api error', { symbol, errMsg, note })
      return []
    }
    const series = json['Time Series (Daily)']
    if (!series || typeof series !== 'object') {
      logKline('AlphaVantage', 'no series', { symbol })
      return []
    }
    const entries = Object.entries(series) as [string, { '1. open': string; '2. high': string; '3. low': string; '4. close': string }][]
    const bars: KlineBar[] = entries
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-limit)
      .map(([time, o]) => ({
        time: time.slice(0, 10),
        open: Number(o['1. open']),
        high: Number(o['2. high']),
        low: Number(o['3. low']),
        close: Number(o['4. close']),
      }))
      .filter((b) => Number.isFinite(b.close))
    logKline('AlphaVantage', 'ok', { symbol, bars: bars.length })
    return bars
  } catch (e) {
    logKline('AlphaVantage', 'error', { symbol, message: e instanceof Error ? e.message : e })
    throw e
  }
}

/** 美股日 K：Yahoo Finance 备用（无需 API Key）。开发环境走 Vite 代理避免 CORS */
function getYahooChartUrl(symbol: string): string {
  const path = `/v8/finance/chart/${encodeURIComponent(symbol)}?range=1y&interval=1d`
  if (import.meta.env.DEV) return `/api/yahoo-chart${path}`
  return `https://query1.finance.yahoo.com${path}`
}

export async function fetchUSKlineYahoo(symbol: string, limit = 120): Promise<KlineBar[]> {
  const url = getYahooChartUrl(symbol)
  logKline('Yahoo', 'request', { symbol, url })
  try {
    const res = await fetch(url)
    logKline('Yahoo', 'response', { symbol, status: res.status, ok: res.ok })
    const text = await res.text()
    if (!res.ok) {
      logKline('Yahoo', 'non-ok body', { symbol, status: res.status, snippet: text.slice(0, 200) })
      throw new Error(`Yahoo 返回 ${res.status}`)
    }
    if (text.trimStart().startsWith('<')) {
      logKline('Yahoo', 'got HTML not JSON', { symbol, snippet: text.slice(0, 150) })
      throw new Error('接口返回了 HTML 而非 JSON，请确认开发代理已生效并重启 dev 服务')
    }
    const json = JSON.parse(text) as { chart?: { result?: YahooChartResult[] } }
    const result = json?.chart?.result?.[0]
    if (!result) {
      logKline('Yahoo', 'no result', { symbol, hasChart: !!json?.chart })
      return []
    }
    const timestamps = (result.timestamp ?? []) as number[]
    const quote = result.indicators?.quote?.[0]
    if (!quote || timestamps.length === 0) {
      logKline('Yahoo', 'empty quote/timestamps', { symbol, tsLen: timestamps.length })
      return []
    }
    const opens = (quote.open ?? []) as number[]
    const highs = (quote.high ?? []) as number[]
    const lows = (quote.low ?? []) as number[]
    const closes = (quote.close ?? []) as number[]
    const out: KlineBar[] = []
    for (let i = 0; i < timestamps.length; i++) {
      const open = opens[i]
      const close = closes[i]
      if (open == null || close == null || !Number.isFinite(open) || !Number.isFinite(close)) continue
      out.push({
        time: new Date(timestamps[i] * 1000).toISOString().slice(0, 10),
        open,
        high: Number.isFinite(highs[i]) ? highs[i]! : Math.max(open, close),
        low: Number.isFinite(lows[i]) ? lows[i]! : Math.min(open, close),
        close,
      })
    }
    const bars = out.slice(-limit)
    logKline('Yahoo', 'ok', { symbol, bars: bars.length })
    return bars
  } catch (e) {
    logKline('Yahoo', 'error', { symbol, err: e, message: e instanceof Error ? e.message : e, cause: e instanceof Error ? (e as Error & { cause?: unknown }).cause : undefined })
    throw e
  }
}

/** secid 转 Ashare 代码：1.600519 -> sh600519, 0.000001 -> sz000001 */
export function secidToAshareCode(secid: string): string {
  const [market, code] = secid.split('.')
  return market === '1' ? `sh${code}` : `sz${code}`
}

/** A 股日 K：腾讯（与 Ashare 一致，见 https://github.com/mpquant/Ashare ） */
export async function fetchCNKlineTencent(ashareCode: string, limit = 120): Promise<KlineBar[]> {
  const url = `https://web.ifzq.gtimg.cn/appstock/app/fqkline/get?param=${encodeURIComponent(ashareCode)},day,,,${limit},qfq`
  const res = await fetch(url)
  const json = await res.json()
  const stk = json?.data?.[ashareCode]
  if (!stk) return []
  const buf = stk.qfqday ?? stk.day ?? []
  if (!Array.isArray(buf)) return []
  const out: KlineBar[] = []
  for (const row of buf) {
    const [timeVal, open, close, high, low] = row as (string | number)[]
    const t = Number(timeVal)
    const time =
      Number.isFinite(t) && t > 0
        ? t > 1e12
          ? new Date(t).toISOString().slice(0, 10)
          : new Date(t * 1000).toISOString().slice(0, 10)
        : String(timeVal ?? '').slice(0, 10)
    const o = Number(open)
    const c = Number(close)
    if (!Number.isFinite(o) || !Number.isFinite(c)) continue
    out.push({
      time,
      open: o,
      close: c,
      high: Number.isFinite(Number(high)) ? Number(high) : Math.max(o, c),
      low: Number.isFinite(Number(low)) ? Number(low) : Math.min(o, c),
    })
  }
  return out
}

/** A 股日 K：新浪（与 Ashare 一致，scale=240 为日线） */
export async function fetchCNKlineSina(ashareCode: string, limit = 120): Promise<KlineBar[]> {
  const url = `https://money.finance.sina.com.cn/quotes_service/api/json_v2.php/CN_MarketData.getKLineData?symbol=${encodeURIComponent(ashareCode)}&scale=240&ma=5&datalen=${limit}`
  const res = await fetch(url)
  const text = await res.text()
  if (!res.ok || text.trimStart().startsWith('<')) return []
  let arr: { day: string; open: string; high: string; low: string; close: string }[]
  try {
    arr = JSON.parse(text) as { day: string; open: string; high: string; low: string; close: string }[]
  } catch {
    return []
  }
  if (!Array.isArray(arr)) return []
  return arr.map((r) => {
    const open = Number(r.open)
    const close = Number(r.close)
    const high = Number(r.high)
    const low = Number(r.low)
    const time = (r.day ?? '').slice(0, 10)
    return {
      time,
      open,
      close,
      high: Number.isFinite(high) ? high : Math.max(open, close),
      low: Number.isFinite(low) ? low : Math.min(open, close),
    }
  })
}

/** A 股日 K：东方财富（klt=101 日K，fqt=0 不复权） */
export async function fetchCNKline(secid: string, limit = 120): Promise<KlineBar[]> {
  const url = `https://push2his.eastmoney.com/api/qt/stock/kline/get?secid=${encodeURIComponent(secid)}&fields1=f1,f2,f3,f4,f5,f6&fields2=f51,f52,f53,f54,f55,f56&klt=101&fqt=0&lmt=${limit}`
  const res = await fetch(url)
  const json = await res.json()
  const data = json?.data
  if (!data) return []
  const arr = (data.klines ?? data.preKlines ?? []) as string[]
  if (!Array.isArray(arr)) return []
  const out: KlineBar[] = []
  for (const line of arr) {
    if (typeof line !== 'string') continue
    const parts = line.split(',')
    if (parts.length < 5) continue
    const rawDate = String(parts[0] ?? '')
    const time =
      rawDate.length === 8
        ? `${rawDate.slice(0, 4)}-${rawDate.slice(4, 6)}-${rawDate.slice(6, 8)}`
        : rawDate.slice(0, 10)
    const open = Number(parts[1])
    const close = Number(parts[2])
    const high = Number(parts[3])
    const low = Number(parts[4])
    if (!Number.isFinite(open) || !Number.isFinite(close)) continue
    out.push({
      time,
      open,
      close,
      high: Number.isFinite(high) ? high : Math.max(open, close),
      low: Number.isFinite(low) ? low : Math.min(open, close),
    })
  }
  return out
}

/** 加密货币 K 线：Binance，支持多周期。日/周用 YYYY-MM-DD，分时用 Unix 秒 */
export async function fetchCryptoKline(
  symbol: string,
  interval: BinanceKlineInterval = '1d',
  limit = 300
): Promise<KlineBar[]> {
  const url = `https://api.binance.com/api/v3/klines?symbol=${encodeURIComponent(symbol)}&interval=${interval}&limit=${limit}`
  const res = await fetch(url)
  const arr = await res.json()
  if (!Array.isArray(arr)) return []
  const isDayOrWeek = interval === '1d' || interval === '1w'
  return arr.map((c: (string | number)[]) => {
    const t = Number(c[0])
    const time = isDayOrWeek ? new Date(t).toISOString().slice(0, 10) : Math.floor(t / 1000)
    return {
      time,
      open: Number(c[1]),
      high: Number(c[2]),
      low: Number(c[3]),
      close: Number(c[4]),
    }
  })
}
