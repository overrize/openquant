import { useEffect, useState, useRef } from 'react'
import type { TickerRow } from '../types'
import {
  fetchUSKline,
  fetchUSKlineYahoo,
  fetchUSKlineAlphaVantage,
  fetchCNKline,
  fetchCNKlineTencent,
  fetchCNKlineSina,
  secidToAshareCode,
  fetchCryptoKline,
  type BinanceKlineInterval,
} from '../api/kline'
import { KlineChart } from './KlineChart'

const BINANCE_WS_KLINE = 'wss://stream.binance.com:9443/ws'
type KlineBar = { time: string | number; open: number; high: number; low: number; close: number }

function mergeCryptoKlineUpdate(prev: KlineBar[], bar: KlineBar): KlineBar[] {
  const idx = prev.findIndex((b) => b.time === bar.time)
  if (idx >= 0) {
    const next = [...prev]
    next[idx] = bar
    return next
  }
  const sorted = [...prev, bar].sort((a, b) =>
    typeof a.time === 'number' && typeof b.time === 'number' ? a.time - b.time : String(a.time).localeCompare(String(b.time))
  )
  return sorted
}

const CRYPTO_INTERVALS_REALTIME: { value: BinanceKlineInterval; label: string }[] = [
  { value: '1m', label: '1 分钟' },
  { value: '5m', label: '5 分钟' },
  { value: '15m', label: '15 分钟' },
  { value: '1h', label: '1 小时' },
]
const CRYPTO_INTERVALS_LONG: { value: BinanceKlineInterval; label: string }[] = [
  { value: '4h', label: '4 小时' },
  { value: '1d', label: '日 K' },
  { value: '1w', label: '周 K' },
]

interface KlineModalProps {
  row: TickerRow | null
  apiKey: string | null
  alphaVantageKey: string | null
  onClose: () => void
}

type KlineRange = 'realtime' | 'long'

export function KlineModal({ row, apiKey, alphaVantageKey, onClose }: KlineModalProps) {
  const [data, setData] = useState<KlineBar[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [range, setRange] = useState<KlineRange>('long')
  const [cryptoInterval, setCryptoInterval] = useState<BinanceKlineInterval>('1d')

  useEffect(() => {
    if (!row) {
      setData([])
      return
    }
    setLoading(true)
    setError(null)
    const type = row.type
    const interval = type === 'crypto' ? cryptoInterval : '1d'
    const run = async () => {
      const log = (tag: string, ...args: unknown[]) => console.log('[KlineModal]', tag, ...args)
      log('start', { type, symbol: row.symbol, id: row.id })
      try {
        if (type === 'stock') {
          let bars: { time: string; open: number; high: number; low: number; close: number }[] = []
          if (apiKey) {
            log('try Finnhub')
            bars = await fetchUSKline(row.symbol, apiKey)
            log('Finnhub result', bars.length, 'bars')
          }
          if (bars.length === 0) {
            try {
              log('try Yahoo')
              bars = await fetchUSKlineYahoo(row.symbol)
              log('Yahoo result', bars.length, 'bars')
            } catch (yahooErr) {
              const is403 = yahooErr instanceof Error && yahooErr.message.includes('403')
              if (is403 && alphaVantageKey) {
                log('Yahoo 403, try Alpha Vantage')
                bars = await fetchUSKlineAlphaVantage(row.symbol, alphaVantageKey)
                log('Alpha Vantage result', bars.length, 'bars')
              } else {
                throw yahooErr
              }
            }
          }
          if (bars.length === 0 && alphaVantageKey) {
            log('try Alpha Vantage')
            bars = await fetchUSKlineAlphaVantage(row.symbol, alphaVantageKey)
            log('Alpha Vantage result', bars.length, 'bars')
          }
          setData(bars)
          if (bars.length === 0) setError('未获取到 K 线数据，请检查代码或稍后重试')
        } else if (type === 'cnstock') {
          const secid = row.id.replace('cnstock-', '')
          const ashareCode = secidToAshareCode(secid)
          let bars: { time: string; open: number; high: number; low: number; close: number }[] = []
          try {
            log('fetch CN Tencent (Ashare)', ashareCode)
            bars = await fetchCNKlineTencent(ashareCode)
            log('Tencent result', bars.length, 'bars')
          } catch {}
          if (bars.length === 0) {
            try {
              log('fetch CN Sina (Ashare)', ashareCode)
              bars = await fetchCNKlineSina(ashareCode)
              log('Sina result', bars.length, 'bars')
            } catch {}
          }
          if (bars.length === 0) {
            log('fetch CN EastMoney', secid)
            bars = await fetchCNKline(secid)
          }
          setData(bars)
          if (bars.length === 0) setError('未获取到 A 股 K 线，请稍后重试')
        } else {
          log('fetch Crypto', row.symbol, interval)
          const limit = interval === '1m' || interval === '5m' ? 300 : interval === '15m' || interval === '1h' ? 200 : 120
          const bars = await fetchCryptoKline(row.symbol, interval, limit)
          setData(bars)
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : '加载 K 线失败'
        console.error('[KlineModal] catch', {
          type,
          symbol: row.symbol,
          error: e,
          message: e instanceof Error ? e.message : String(e),
          cause: e instanceof Error ? e.cause : undefined,
          stack: e instanceof Error ? e.stack : undefined,
        })
        setError(msg)
        setData([])
      } finally {
        setLoading(false)
      }
    }
    run()
  }, [row, apiKey, alphaVantageKey, cryptoInterval])

  useEffect(() => {
    if (!row || row.type !== 'crypto') return
    const symbol = row.symbol.toLowerCase()
    const wsUrl = `${BINANCE_WS_KLINE}/${symbol}@kline_${cryptoInterval}`
    const ws = new WebSocket(wsUrl)
    const isDayOrWeek = cryptoInterval === '1d' || cryptoInterval === '1w'
    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data as string)
        if (msg?.e !== 'kline' || !msg?.k) return
        const k = msg.k
        const time = isDayOrWeek ? new Date(Number(k.t)).toISOString().slice(0, 10) : Math.floor(Number(k.t) / 1000)
        const bar: KlineBar = {
          time,
          open: Number(k.o),
          high: Number(k.h),
          low: Number(k.l),
          close: Number(k.c),
        }
        setData((prev) => (prev.length ? mergeCryptoKlineUpdate(prev, bar) : [bar]))
      } catch {}
    }
    return () => { ws.close() }
  }, [row?.id, row?.type, row?.symbol, cryptoInterval])

  if (!row) return null

  const title = row.name ? `${row.symbol} ${row.name}` : row.symbol
  const isCrypto = row.type === 'crypto'
  const intervalLabel =
    isCrypto &&
    (range === 'realtime'
      ? CRYPTO_INTERVALS_REALTIME.find((x) => x.value === cryptoInterval)?.label ?? cryptoInterval
      : CRYPTO_INTERVALS_LONG.find((x) => x.value === cryptoInterval)?.label ?? cryptoInterval)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div
        className="bg-[var(--panel)] border border-[var(--border)] rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-b border-[var(--border)]">
          <div className="flex items-center gap-3 flex-wrap">
            <h3 className="text-lg font-semibold text-[var(--text)]">
              {isCrypto ? `${intervalLabel ?? 'K 线'} · ${title}` : `日 K 线 · ${title}`}
            </h3>
            {isCrypto && (
              <div className="flex items-center gap-1 text-sm">
                <span className="text-[var(--muted)]">周期：</span>
                <div className="flex rounded-lg border border-[var(--border)] p-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      setRange('realtime')
                      if (!CRYPTO_INTERVALS_REALTIME.some((x) => x.value === cryptoInterval)) setCryptoInterval('1m')
                    }}
                    className={`px-2.5 py-1 rounded-md text-sm ${range === 'realtime' ? 'bg-[var(--bg)] text-[var(--text)]' : 'text-[var(--muted)] hover:text-[var(--text)]'}`}
                  >
                    实时
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setRange('long')
                      if (!CRYPTO_INTERVALS_LONG.some((x) => x.value === cryptoInterval)) setCryptoInterval('1d')
                    }}
                    className={`px-2.5 py-1 rounded-md text-sm ${range === 'long' ? 'bg-[var(--bg)] text-[var(--text)]' : 'text-[var(--muted)] hover:text-[var(--text)]'}`}
                  >
                    长期
                  </button>
                </div>
                <div className="flex gap-1 flex-wrap">
                  {(range === 'realtime' ? CRYPTO_INTERVALS_REALTIME : CRYPTO_INTERVALS_LONG).map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setCryptoInterval(opt.value)}
                      className={`px-2 py-1 rounded text-xs ${cryptoInterval === opt.value ? 'bg-blue-600/30 text-blue-300' : 'text-[var(--muted)] hover:text-[var(--text)] hover:bg-white/5'}`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[var(--muted)] hover:text-[var(--text)] p-1 rounded"
            aria-label="关闭"
          >
            ✕
          </button>
        </div>
        <div className="p-4 overflow-auto flex-1 min-h-0 min-w-0 flex flex-col">
          {loading && <div className="text-[var(--muted)] py-8 text-center">加载中…</div>}
          {error && (
            <div className="text-red-400 py-4 text-center">
              <div>{error}</div>
              {error.includes('403') && (
                <div className="text-xs text-[var(--muted)] mt-2 max-w-md mx-auto">
                  美股 K 线：Yahoo 拒绝访问。可在设置中配置 Alpha Vantage API Key（免费约 25 次/天）以获取日 K 线；开发环境也可先重启 dev（npm run dev）试代理。
                </div>
              )}
              {error.includes('fetch') && !error.includes('403') && (
                <div className="text-xs text-[var(--muted)] mt-2 max-w-md mx-auto">
                  可能原因：网络异常、CORS 拦截或域名被墙。请打开 F12 → Console 查看 [Kline] / [KlineModal] 日志。
                </div>
              )}
            </div>
          )}
          {!loading && !error && data.length > 0 && (
            <div className="w-full flex-1 min-h-[400px]" style={{ minWidth: 320 }}>
              <KlineChart data={data} height={400} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
