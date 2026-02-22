import { useCallback, useMemo, useState } from 'react'
import type { TickerRow } from './types'
import { useCryptoPrices } from './hooks/useCryptoPrices'
import { useStockPrices } from './hooks/useStockPrices'
import { useStockQuotes } from './hooks/useStockQuotes'
import { STOCK_SYMBOLS, CRYPTO_SYMBOLS, CN_STOCK_SYMBOLS } from './types'
import { useCnStockQuotes } from './hooks/useCnStockQuotes'
import { Dashboard } from './components/Dashboard'
import { Settings } from './components/Settings'

const FINNHUB_KEY = 'finnhub_apikey'

function App() {
  const [tickers, setTickers] = useState<Record<string, TickerRow>>(() => {
    const initial: Record<string, TickerRow> = {}
    STOCK_SYMBOLS.forEach((s) => {
      initial[`stock-${s}`] = {
        id: `stock-${s}`,
        type: 'stock',
        symbol: s,
        price: 0,
        lastUpdate: 0,
      }
    })
    CRYPTO_SYMBOLS.forEach((s) => {
      initial[`crypto-${s}`] = {
        id: `crypto-${s}`,
        type: 'crypto',
        symbol: s,
        price: 0,
        lastUpdate: 0,
      }
    })
    CN_STOCK_SYMBOLS.forEach((s) => {
      initial[`cnstock-${s.secid}`] = {
        id: `cnstock-${s.secid}`,
        type: 'cnstock',
        symbol: s.code,
        name: s.name,
        price: 0,
        lastUpdate: 0,
      }
    })
    return initial
  })

  const [apiKey, setApiKey] = useState<string>(() => localStorage.getItem(FINNHUB_KEY) || '')
  const [showSettings, setShowSettings] = useState(false)

  const mergeUpdates = useCallback((updates: Partial<TickerRow>[]) => {
    setTickers((prev) => {
      const next = { ...prev }
      for (const u of updates) {
        if (!u.id) continue
        const cur = next[u.id]
        next[u.id] = {
          ...cur,
          ...u,
          id: u.id || cur?.id,
          type: u.type ?? cur?.type ?? 'stock',
          symbol: u.symbol ?? cur?.symbol ?? '',
          price: u.price ?? cur?.price ?? 0,
          lastUpdate: u.lastUpdate ?? cur?.lastUpdate ?? 0,
        }
      }
      return next
    })
  }, [])

  useStockQuotes(apiKey || null, STOCK_SYMBOLS, mergeUpdates)
  useStockPrices(apiKey || null, STOCK_SYMBOLS, mergeUpdates)
  useCryptoPrices(CRYPTO_SYMBOLS, mergeUpdates)
  useCnStockQuotes(CN_STOCK_SYMBOLS, mergeUpdates)

  const saveApiKey = useCallback((key: string) => {
    setApiKey(key)
    localStorage.setItem(FINNHUB_KEY, key)
  }, [])

  const stockList = useMemo(
    () => STOCK_SYMBOLS.map((s) => tickers[`stock-${s}`]).filter(Boolean),
    [tickers]
  )
  const cryptoList = useMemo(
    () => CRYPTO_SYMBOLS.map((s) => tickers[`crypto-${s}`]).filter(Boolean),
    [tickers]
  )
  const cnStockList = useMemo(
    () => CN_STOCK_SYMBOLS.map((s) => tickers[`cnstock-${s.secid}`]).filter(Boolean),
    [tickers]
  )

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
        <Dashboard stockList={stockList} cryptoList={cryptoList} cnStockList={cnStockList} />
      </main>
      {showSettings && (
        <Settings
          apiKey={apiKey}
          onSave={saveApiKey}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  )
}

export default App
