import { useCallback, useMemo, useState, useEffect } from 'react'
import type { TickerRow, CnStockSymbol } from './types'
import { useCryptoPrices } from './hooks/useCryptoPrices'
import { useStockPrices } from './hooks/useStockPrices'
import { useStockQuotes } from './hooks/useStockQuotes'
import { STOCK_SYMBOLS as DEFAULT_STOCKS, CRYPTO_SYMBOLS as DEFAULT_CRYPTO, CN_STOCK_SYMBOLS as DEFAULT_CN, COMMODITY_SYMBOLS as DEFAULT_COMMODITY, STOCK_NAMES, COMMODITY_NAMES } from './types'
import { useCnStockQuotes } from './hooks/useCnStockQuotes'
import { useBot } from './hooks/useBot'
import { useTenderOffers } from './hooks/useTenderOffers'
import { Dashboard } from './components/Dashboard'
import { Settings } from './components/Settings'
import { DEFAULT_BOT_CONFIG } from './bot/types'

const FINNHUB_KEY = 'finnhub_apikey'
const ALPHA_VANTAGE_KEY = 'alpha_vantage_apikey'
const LS_STOCKS = 'watch_stock_symbols'
const LS_CRYPTO = 'watch_crypto_symbols'
const LS_CN = 'watch_cn_symbols'
const LS_COMMODITY = 'watch_commodity_symbols'
const LLM_API_URL_KEY = 'bot_llm_api_url'
const LLM_API_KEY = 'bot_llm_api_key'
const BOT_CONFIG_KEY = 'bot_config'

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
  const [commoditySymbols, setCommoditySymbols] = useState<string[]>(() =>
    loadJson<string[]>(LS_COMMODITY, DEFAULT_COMMODITY)
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
  useEffect(() => {
    localStorage.setItem(LS_COMMODITY, JSON.stringify(commoditySymbols))
  }, [commoditySymbols])

  const buildTickers = useCallback(
    (
      stocks: string[],
      cryptos: string[],
      cns: CnStockSymbol[],
      commodities: string[],
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
      commodities.forEach((s) => {
        const id = `commodity-${s}`
        ids.add(id)
        if (!next[id])
          next[id] = {
            id,
            type: 'commodity',
            symbol: s,
            name: COMMODITY_NAMES[s],
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
      loadJson<CnStockSymbol[]>(LS_CN, DEFAULT_CN),
      loadJson<string[]>(LS_COMMODITY, DEFAULT_COMMODITY)
    )
  )
  useEffect(() => {
    setTickers((prev) => buildTickers(stockSymbols, cryptoSymbols, cnSymbols, commoditySymbols, prev))
  }, [stockSymbols, cryptoSymbols, cnSymbols, commoditySymbols, buildTickers])

  const [apiKey, setApiKey] = useState<string>(() => localStorage.getItem(FINNHUB_KEY) || '')
  const [alphaVantageKey, setAlphaVantageKey] = useState<string>(() => localStorage.getItem(ALPHA_VANTAGE_KEY) || '')
  const [llmApiUrl, setLlmApiUrl] = useState<string>(() => localStorage.getItem(LLM_API_URL_KEY) || '')
  const [llmApiKey, setLlmApiKey] = useState<string>(() => localStorage.getItem(LLM_API_KEY) || '')
  const [showSettings, setShowSettings] = useState(false)

  const [botConfig, setBotConfig] = useState(() => {
    try {
      const s = localStorage.getItem(BOT_CONFIG_KEY)
      if (s) {
        const parsed = JSON.parse(s) as Partial<typeof DEFAULT_BOT_CONFIG>
        return { ...DEFAULT_BOT_CONFIG, ...parsed }
      }
    } catch {}
    return { ...DEFAULT_BOT_CONFIG }
  })
  useEffect(() => {
    localStorage.setItem(BOT_CONFIG_KEY, JSON.stringify(botConfig))
  }, [botConfig])

  const llmConfig = useMemo(() => {
    if (!llmApiUrl?.trim() || !llmApiKey?.trim()) return null
    return { apiUrl: llmApiUrl.trim(), apiKey: llmApiKey.trim() }
  }, [llmApiUrl, llmApiKey])

  const {
    paperState: botPaperState,
    running: botRunning,
    lastSignal: botLastSignal,
    error: botError,
    start: botStart,
    stop: botStop,
  } = useBot(botConfig, llmConfig)

  const {
    list: tenderOfferList,
    loading: tenderOfferLoading,
    error: tenderOfferError,
    refreshFilings: onTenderOfferRefreshFilings,
    refreshPrices: onTenderOfferRefreshPrices,
  } = useTenderOffers(apiKey || null)

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
  useStockQuotes(apiKey || null, commoditySymbols, mergeUpdates, { idPrefix: 'commodity', assetType: 'commodity' })
  useStockPrices(apiKey || null, commoditySymbols, mergeUpdates, { idPrefix: 'commodity', assetType: 'commodity' })
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
  const saveLlmConfig = useCallback((url: string, key: string) => {
    setLlmApiUrl(url)
    setLlmApiKey(key)
    localStorage.setItem(LLM_API_URL_KEY, url)
    localStorage.setItem(LLM_API_KEY, key)
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
  const commodityList = useMemo(
    () => commoditySymbols.map((s) => tickers[`commodity-${s}`]).filter(Boolean),
    [tickers, commoditySymbols]
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

  const addCommodity = useCallback((symbol: string) => {
    const s = symbol.trim().toUpperCase()
    if (!s || commoditySymbols.includes(s)) return
    setCommoditySymbols((prev) => [...prev, s])
  }, [commoditySymbols])
  const removeCommodity = useCallback((symbol: string) => {
    setCommoditySymbols((prev) => prev.filter((x) => x !== symbol))
  }, [])

  return (
    <div className="min-h-screen flex flex-col bg-mesh">
      <header className="sticky top-0 z-40 border-b border-[var(--border)] px-6 py-3 flex items-center justify-between glass-card">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center shadow-glow">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
              <polyline points="16 7 22 7 22 13" />
            </svg>
          </div>
          <h1 className="text-lg font-bold tracking-tight gradient-text">
            OpenQuant
          </h1>
          <span className="text-xs text-[var(--muted)] hidden sm:inline ml-1">量化分析平台</span>
        </div>
        <button
          type="button"
          onClick={() => setShowSettings(true)}
          className="btn-ghost flex items-center gap-2 text-sm"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
          <span className="hidden sm:inline">设置</span>
        </button>
      </header>

      <main className="flex-1 p-4 sm:p-6">
        <Dashboard
          stockList={stockList}
          cryptoList={cryptoList}
          cnStockList={cnStockList}
          priceHistory={priceHistory}
          apiKey={apiKey || null}
          alphaVantageKey={alphaVantageKey || null}
          botConfig={botConfig}
          onBotConfigChange={(c) => setBotConfig((prev) => ({ ...prev, ...c }))}
          botPaperState={botPaperState}
          botRunning={botRunning}
          botLastSignal={botLastSignal}
          botError={botError}
          llmConfig={llmConfig}
          onBotStart={botStart}
          onBotStop={botStop}
          tenderOfferList={tenderOfferList}
          tenderOfferLoading={tenderOfferLoading}
          tenderOfferError={tenderOfferError}
          onTenderOfferRefreshFilings={onTenderOfferRefreshFilings}
          onTenderOfferRefreshPrices={onTenderOfferRefreshPrices}
          onAddStock={addStock}
          onRemoveStock={removeStock}
          onAddCrypto={addCrypto}
          onRemoveCrypto={removeCrypto}
          onAddCn={addCn}
          onRemoveCn={removeCn}
          commodityList={commodityList}
          onAddCommodity={addCommodity}
          onRemoveCommodity={removeCommodity}
        />
      </main>

      {showSettings && (
        <Settings
          apiKey={apiKey}
          alphaVantageKey={alphaVantageKey}
          llmApiUrl={llmApiUrl}
          llmApiKey={llmApiKey}
          onSave={saveApiKey}
          onSaveAlphaVantage={saveAlphaVantageKey}
          onSaveLlm={saveLlmConfig}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  )
}

export default App
