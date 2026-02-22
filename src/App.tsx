import { useCallback, useMemo, useState, useEffect } from 'react'
import type { TickerRow, CnStockSymbol } from './types'
import { useCryptoPrices } from './hooks/useCryptoPrices'
import { useStockPrices } from './hooks/useStockPrices'
import { useStockQuotes } from './hooks/useStockQuotes'
import { STOCK_SYMBOLS as DEFAULT_STOCKS, CRYPTO_SYMBOLS as DEFAULT_CRYPTO, CN_STOCK_SYMBOLS as DEFAULT_CN, STOCK_NAMES } from './types'
import { useCnStockQuotes } from './hooks/useCnStockQuotes'
import { Dashboard } from './components/Dashboard'
import { Settings } from './components/Settings'

const FINNHUB_KEY = 'finnhub_apikey'
const ALPHA_VANTAGE_KEY = 'alpha_vantage_apikey'
const LS_STOCKS = 'watch_stock_symbols'
const LS_CRYPTO = 'watch_crypto_symbols'
const LS_CN = 'watch_cn_symbols'

function loadJson<T>(key: string, fallback: T): T {
  try {
    const s = localStorage.getItem(key)
    if (s) return JSON.parse(s) as T
  } catch {}
  return fallback
}

function App() {
  const [stockSymbols, setStockSymbols] = useState<string[]>(() =>
    loadJson<string[]>(LS_STOCKS, DEFAULT_STOCKS)
  )
  const [cryptoSymbols, setCryptoSymbols] = useState<string[]>(() =>
    loadJson<string[]>(LS_CRYPTO, DEFAULT_CRYPTO)
  )
  const [cnSymbols, setCnSymbols] = useState<CnStockSymbol[]>(() =>
    loadJson<CnStockSymbol[]>(LS_CN, DEFAULT_CN)
  )

  useEffect(() => {
    localStorage.setItem(LS_STOCKS, JSON.stringify(stockSymbols))
  }, [stockSymbols])
  useEffect(() => {
    localStorage.setItem(LS_CRYPTO, JSON.stringify(cryptoSymbols))
  }, [cryptoSymbols])
  useEffect(() => {
    localStorage.setItem(LS_CN, JSON.stringify(cnSymbols))
  }, [cnSymbols])

  const buildTickers = useCallback(
    (
      stocks: string[],
      cryptos: string[],
      cns: CnStockSymbol[],
      prev: Record<string, TickerRow> = {}
    ) => {
      const next = { ...prev }
      const ids = new Set<string>()
      stocks.forEach((s) => {
        const id = `stock-${s}`
        ids.add(id)
        if (!next[id])
          next[id] = {
            id,
            type: 'stock',
            symbol: s,
            name: STOCK_NAMES[s],
            price: 0,
            lastUpdate: 0,
          }
      })
      cryptos.forEach((s) => {
        const id = `crypto-${s}`
        ids.add(id)
        if (!next[id]) next[id] = { id, type: 'crypto', symbol: s, price: 0, lastUpdate: 0 }
      })
      cns.forEach((s) => {
        const id = `cnstock-${s.secid}`
        ids.add(id)
        if (!next[id])
          next[id] = {
            id,
            type: 'cnstock',
            symbol: s.code,
            name: s.name,
            price: 0,
            lastUpdate: 0,
          }
      })
      Object.keys(next).forEach((id) => {
        if (!ids.has(id)) delete next[id]
      })
      return next
    },
    []
  )

  const [tickers, setTickers] = useState<Record<string, TickerRow>>(() =>
    buildTickers(
      loadJson<string[]>(LS_STOCKS, DEFAULT_STOCKS),
      loadJson<string[]>(LS_CRYPTO, DEFAULT_CRYPTO),
      loadJson<CnStockSymbol[]>(LS_CN, DEFAULT_CN)
    )
  )
  useEffect(() => {
    setTickers((prev) => buildTickers(stockSymbols, cryptoSymbols, cnSymbols, prev))
  }, [stockSymbols, cryptoSymbols, cnSymbols, buildTickers])

  const [apiKey, setApiKey] = useState<string>(() => localStorage.getItem(FINNHUB_KEY) || '')
  const [alphaVantageKey, setAlphaVantageKey] = useState<string>(() => localStorage.getItem(ALPHA_VANTAGE_KEY) || '')
  const [showSettings, setShowSettings] = useState(false)

  const MAX_SPARK_POINTS = 24
  const [priceHistory, setPriceHistory] = useState<Record<string, number[]>>({})

  const mergeUpdates = useCallback((updates: Partial<TickerRow>[]) => {
    setTickers((prev) => {
      const next = { ...prev }
      for (const u of updates) {
        if (!u.id) continue
        const cur = next[u.id]
        const price = u.price ?? cur?.price ?? 0
        next[u.id] = {
          ...cur,
          ...u,
          id: u.id || cur?.id,
          type: u.type ?? cur?.type ?? 'stock',
          symbol: u.symbol ?? cur?.symbol ?? '',
          name: u.name !== undefined ? u.name : cur?.name,
          price,
          lastUpdate: u.lastUpdate ?? cur?.lastUpdate ?? 0,
        }
      }
      return next
    })
    setPriceHistory((h) => {
      let changed = false
      const out = { ...h }
      for (const u of updates) {
        if (!u.id || u.price == null || u.price <= 0) continue
        const prevArr = out[u.id] ?? []
        out[u.id] = [...prevArr, u.price].slice(-MAX_SPARK_POINTS)
        changed = true
      }
      return changed ? out : h
    })
  }, [])

  useStockQuotes(apiKey || null, stockSymbols, mergeUpdates)
  useStockPrices(apiKey || null, stockSymbols, mergeUpdates)
  useCryptoPrices(cryptoSymbols, mergeUpdates)
  useCnStockQuotes(cnSymbols, mergeUpdates)

  const saveApiKey = useCallback((key: string) => {
    setApiKey(key)
    localStorage.setItem(FINNHUB_KEY, key)
  }, [])
  const saveAlphaVantageKey = useCallback((key: string) => {
    setAlphaVantageKey(key)
    localStorage.setItem(ALPHA_VANTAGE_KEY, key)
  }, [])

  const stockList = useMemo(
    () => stockSymbols.map((s) => tickers[`stock-${s}`]).filter(Boolean),
    [tickers, stockSymbols]
  )
  const cryptoList = useMemo(
    () => cryptoSymbols.map((s) => tickers[`crypto-${s}`]).filter(Boolean),
    [tickers, cryptoSymbols]
  )
  const cnStockList = useMemo(
    () => cnSymbols.map((s) => tickers[`cnstock-${s.secid}`]).filter(Boolean),
    [tickers, cnSymbols]
  )

  const addStock = useCallback((symbol: string) => {
    const s = symbol.trim().toUpperCase()
    if (!s || stockSymbols.includes(s)) return
    setStockSymbols((prev) => [...prev, s])
  }, [stockSymbols])
  const removeStock = useCallback((symbol: string) => {
    setStockSymbols((prev) => prev.filter((x) => x !== symbol))
  }, [])

  const addCrypto = useCallback((symbol: string) => {
    const s = symbol.trim().toUpperCase()
    if (!s) return
    const sym = s.endsWith('USDT') ? s : `${s}USDT`
    if (cryptoSymbols.includes(sym)) return
    setCryptoSymbols((prev) => [...prev, sym])
  }, [cryptoSymbols])
  const removeCrypto = useCallback((symbol: string) => {
    setCryptoSymbols((prev) => prev.filter((x) => x !== symbol))
  }, [])

  const addCn = useCallback((code: string) => {
    const c = String(code).trim().replace(/\D/g, '')
    if (c.length < 5) return
    const secid = /^6/.test(c) ? `1.${c}` : `0.${c}`
    if (cnSymbols.some((x) => x.secid === secid)) return
    setCnSymbols((prev) => [...prev, { secid, code: c, name: '' }])
  }, [cnSymbols])
  const removeCn = useCallback((secid: string) => {
    setCnSymbols((prev) => prev.filter((x) => x.secid !== secid))
  }, [])

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-[var(--border)] px-4 py-3 flex items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight text-[var(--text)]">
          量化盯盘
        </h1>
        <button
          type="button"
          onClick={() => setShowSettings(true)}
          className="text-sm text-[var(--muted)] hover:text-[var(--text)] px-3 py-1.5 rounded border border-[var(--border)]"
        >
          设置
        </button>
      </header>
      <main className="flex-1 p-4">
        <Dashboard
          stockList={stockList}
          cryptoList={cryptoList}
          cnStockList={cnStockList}
          priceHistory={priceHistory}
          apiKey={apiKey || null}
          alphaVantageKey={alphaVantageKey || null}
          onAddStock={addStock}
          onRemoveStock={removeStock}
          onAddCrypto={addCrypto}
          onRemoveCrypto={removeCrypto}
          onAddCn={addCn}
          onRemoveCn={removeCn}
        />
      </main>
      {showSettings && (
        <Settings
          apiKey={apiKey}
          alphaVantageKey={alphaVantageKey}
          onSave={saveApiKey}
          onSaveAlphaVantage={saveAlphaVantageKey}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  )
}

export default App
