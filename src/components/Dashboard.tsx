import { useState } from 'react'
import type { TickerRow } from '../types'
import type { BotConfig } from '../bot/types'
import { TickerRow as TickerRowComponent } from './TickerRow'
import { KlineModal } from './KlineModal'
import { BotPanel } from './BotPanel'
import { ResearchPanel } from './ResearchPanel'
import { TenderOfferPanel } from './TenderOfferPanel'
import { useMarketOverview, useMarketOverviewUs } from '../hooks/useMarketOverview'
import { useCryptoFearGreed, useCryptoRSI, useAltcoinSeasonIndex } from '../hooks/useCryptoFearGreed'
import { MarketOverviewPanel } from './MarketOverviewPanel'
import type { LlmFactorConfig } from '../bot/llmFactor'

type TabId = 'us' | 'cn' | 'crypto' | 'commodity' | 'bot' | 'research' | 'tender'

interface DashboardProps {
  stockList: TickerRow[]
  cryptoList: TickerRow[]
  cnStockList: TickerRow[]
  commodityList: TickerRow[]
  priceHistory: Record<string, number[]>
  apiKey: string | null
  alphaVantageKey: string | null
  botConfig: BotConfig
  onBotConfigChange: (c: Partial<BotConfig>) => void
  botPaperState: import('../bot/types').PaperState | null
  botRunning: boolean
  botLastSignal: import('../bot/types').Signal | null
  botError: string | null
  llmConfig: LlmFactorConfig | null
  onBotStart: () => void
  onBotStop: () => void
  tenderOfferList: import('../api/tenderOffer').TenderOfferItem[]
  tenderOfferLoading: boolean
  tenderOfferError: string | null
  onTenderOfferRefreshFilings: () => void
  onTenderOfferRefreshPrices: () => void
  onAddStock: (symbol: string) => void
  onRemoveStock: (symbol: string) => void
  onAddCrypto: (symbol: string) => void
  onRemoveCrypto: (symbol: string) => void
  onAddCn: (code: string) => void
  onRemoveCn: (secid: string) => void
  onAddCommodity: (symbol: string) => void
  onRemoveCommodity: (symbol: string) => void
}

const TAB_ICONS: Record<TabId, JSX.Element> = {
  us: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="20" x2="12" y2="10" /><line x1="18" y1="20" x2="18" y2="4" /><line x1="6" y1="20" x2="6" y2="16" />
    </svg>
  ),
  cn: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  ),
  crypto: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
  bot: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="10" rx="2" /><circle cx="12" cy="5" r="2" /><path d="M12 7v4" /><line x1="8" y1="16" x2="8" y2="16" /><line x1="16" y1="16" x2="16" y2="16" />
    </svg>
  ),
  research: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  ),
  tender: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </svg>
  ),
  commodity: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2L9 8H3l3 6 6-12 3 6h6l-3 6-3-6z" />
    </svg>
  ),
}

const TABS: { id: TabId; label: string; desc: string }[] = [
  { id: 'us', label: '美股', desc: '实时行情' },
  { id: 'cn', label: 'A股', desc: '约8s刷新' },
  { id: 'crypto', label: '加密货币', desc: '实时推送' },
  { id: 'commodity', label: '贵金属·原油', desc: '黄金/白银/原油' },
  { id: 'bot', label: '自动交易', desc: '虚拟盘' },
  { id: 'research', label: '研报分析', desc: '因子计算' },
  { id: 'tender', label: '要约收购', desc: '套利扫描' },
]

export function Dashboard({
  stockList,
  cryptoList,
  cnStockList,
  apiKey,
  alphaVantageKey,
  botConfig,
  onBotConfigChange,
  botPaperState,
  botRunning,
  botLastSignal,
  botError,
  llmConfig,
  onBotStart,
  onBotStop,
  tenderOfferList,
  tenderOfferLoading,
  tenderOfferError,
  onTenderOfferRefreshFilings,
  onTenderOfferRefreshPrices,
  commodityList,
  onAddCommodity,
  onRemoveCommodity,
  onAddStock,
  onRemoveStock,
  onAddCrypto,
  onRemoveCrypto,
  onAddCn,
  onRemoveCn,
  priceHistory,
}: DashboardProps) {
  const [activeTab, setActiveTab] = useState<TabId>('us')
  const [klineRow, setKlineRow] = useState<TickerRow | null>(null)
  const [searchUs, setSearchUs] = useState('')
  const [searchCrypto, setSearchCrypto] = useState('')
  const [searchCn, setSearchCn] = useState('')
  const [searchCommodity, setSearchCommodity] = useState('')
  const marketOverview = useMarketOverview(activeTab === 'cn')
  const usMarketOverview = useMarketOverviewUs(apiKey, activeTab === 'us')
  const cryptoFearGreed = useCryptoFearGreed(activeTab === 'crypto')
  const cryptoRsiList = useCryptoRSI(
    activeTab === 'crypto' ? cryptoList.map((r) => r.symbol) : [],
    activeTab === 'crypto'
  )
  const altcoinSeasonIndex = useAltcoinSeasonIndex(activeTab === 'crypto')

  return (
    <div className="max-w-6xl mx-auto">
      {/* Tab navigation */}
      <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
        {TABS.map(({ id, label, desc }) => (
          <button
            key={id}
            type="button"
            onClick={() => setActiveTab(id)}
            className={`group flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 shrink-0 ${
              activeTab === id
                ? 'bg-gradient-to-r from-blue-600/20 to-violet-600/20 text-[var(--text)] border border-blue-500/30 shadow-glow'
                : 'text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--panel)] border border-transparent'
            }`}
          >
            <span className={`transition-colors ${activeTab === id ? 'text-blue-400' : 'text-[var(--muted)] group-hover:text-[var(--text)]'}`}>
              {TAB_ICONS[id]}
            </span>
            <div className="text-left">
              <div>{label}</div>
              <div className={`text-[10px] leading-tight ${activeTab === id ? 'text-blue-400/70' : 'text-[var(--muted)]/70'}`}>
                {desc}
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="glass-card rounded-2xl overflow-hidden shadow-card animate-fadeIn">
        {activeTab === 'us' && (
          <div>
            <div className="border-b border-[var(--border)]">
              <MarketOverviewPanel
                indices={usMarketOverview.indices}
                sentiment={usMarketOverview.sentiment}
                behavior={usMarketOverview.behavior}
                loading={usMarketOverview.loading}
              />
            </div>
            <div className="flex gap-2 px-4 py-3 border-b border-[var(--border)]">
              <input
                type="text"
                value={searchUs}
                onChange={(e) => setSearchUs(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    onAddStock(searchUs)
                    setSearchUs('')
                  }
                }}
                placeholder="输入美股代码添加，如 AAPL"
                className="flex-1 input-field text-sm"
              />
              <button
                type="button"
                onClick={() => { onAddStock(searchUs); setSearchUs('') }}
                className="btn-primary"
              >
                添加
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-xs text-[var(--muted)] border-b border-[var(--border)] bg-[var(--bg)]/30">
                    <th className="py-3 px-4 font-medium">代码 / 公司</th>
                    <th className="py-3 px-4 text-right font-medium">最新价(USD)</th>
                    <th className="py-3 px-4 text-right font-medium">前收(USD)</th>
                    <th className="py-3 px-4 text-right font-medium">涨跌额</th>
                    <th className="py-3 px-4 text-right font-medium">涨跌幅</th>
                    <th className="py-3 px-4 w-10" />
                  </tr>
                </thead>
                <tbody>
                  {stockList.map((row) => (
                    <TickerRowComponent
                      key={row.id}
                      row={row}
                      showName
                      showPrevShowChange
                      showSparkline={false}
                      onRowClick={setKlineRow}
                      onDelete={() => onRemoveStock(row.symbol)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'cn' && (
          <div>
            <div className="border-b border-[var(--border)]">
              <MarketOverviewPanel
                indices={marketOverview.indices}
                sentiment={marketOverview.sentiment}
                behavior={marketOverview.behavior}
                loading={marketOverview.loading}
              />
            </div>
            <div className="flex gap-2 px-4 py-3 border-b border-[var(--border)]">
              <input
                type="text"
                value={searchCn}
                onChange={(e) => setSearchCn(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    onAddCn(searchCn)
                    setSearchCn('')
                  }
                }}
                placeholder="输入 A 股代码添加，如 600519"
                className="flex-1 input-field text-sm"
              />
              <button
                type="button"
                onClick={() => { onAddCn(searchCn); setSearchCn('') }}
                className="btn-primary"
              >
                添加
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-xs text-[var(--muted)] border-b border-[var(--border)] bg-[var(--bg)]/30">
                    <th className="py-3 px-4 font-medium">代码 / 名称</th>
                    <th className="py-3 px-4 text-right font-medium">最新价(CNY)</th>
                    <th className="py-3 px-4 text-right font-medium">前收(CNY)</th>
                    <th className="py-3 px-4 text-right font-medium">涨跌额</th>
                    <th className="py-3 px-4 text-right font-medium">涨跌幅</th>
                    <th className="py-3 px-4 text-center font-medium">K线</th>
                    <th className="py-3 px-4 w-10" />
                  </tr>
                </thead>
                <tbody>
                  {cnStockList.map((row) => (
                    <TickerRowComponent
                      key={row.id}
                      row={row}
                      showName
                      showPrevShowChange
                      showSparkline
                      sparkPoints={priceHistory[row.id]}
                      onRowClick={setKlineRow}
                      onDelete={() => onRemoveCn(row.id.replace('cnstock-', ''))}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'crypto' && (
          <div>
            <div className="px-5 py-4 border-b border-[var(--border)] space-y-3 bg-[var(--bg)]/30">
              {cryptoList.some((r) => r.symbol === 'BTCUSDT') && (
                <div className="flex flex-wrap items-center gap-4">
                  <span className="text-xs font-medium text-[var(--muted)] uppercase tracking-wider">市场参考</span>
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center">
                      <span className="text-xs font-bold text-amber-400">B</span>
                    </span>
                    <span className="text-lg font-semibold font-mono text-[var(--text)]">
                      {(() => {
                        const btc = cryptoList.find((r) => r.symbol === 'BTCUSDT')
                        return btc?.price ? btc.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—'
                      })()}
                    </span>
                    <span className="text-xs text-[var(--muted)]">USDT</span>
                  </div>
                </div>
              )}
              {cryptoFearGreed && (
                <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-[var(--border)]/50">
                  <span className="text-xs font-medium text-[var(--muted)] uppercase tracking-wider">恐慌贪婪指数</span>
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-500/20 via-amber-500/20 to-green-500/20 flex items-center justify-center border border-[var(--border)]">
                      <span className="font-mono font-bold text-sm">{cryptoFearGreed.value}</span>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-[var(--text)]">{cryptoFearGreed.classification}</div>
                      <div className="text-xs text-[var(--muted)]">0=极度恐慌 100=极度贪婪</div>
                    </div>
                  </div>
                </div>
              )}
              {altcoinSeasonIndex != null && (
                <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-[var(--border)]/50">
                  <span className="text-xs font-medium text-[var(--muted)] uppercase tracking-wider">山寨币季节指数</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sm w-10 text-center">{altcoinSeasonIndex}</span>
                    <span className="text-xs text-[var(--muted)]">
                      &gt;75=山寨季 &lt;25=比特币季
                    </span>
                  </div>
                </div>
              )}
              {cryptoRsiList.length > 0 && (
                <div className="pt-2 border-t border-[var(--border)]/50">
                  <div className="text-xs font-medium text-[var(--muted)] mb-2 uppercase tracking-wider">RSI(14) 热力图</div>
                  <div className="flex flex-wrap gap-2">
                    {cryptoRsiList.map(({ symbol, rsi }) => {
                      const label = symbol.replace('USDT', '')
                      const rsiNum = rsi ?? 0
                      const bg =
                        rsi == null
                          ? 'bg-[var(--border)] text-[var(--muted)]'
                          : rsiNum < 30
                            ? 'bg-emerald-600/30 text-emerald-200 border border-emerald-500/30'
                            : rsiNum > 70
                              ? 'bg-red-600/30 text-red-200 border border-red-500/30'
                              : 'bg-amber-600/20 text-amber-200 border border-amber-500/30'
                      return (
                        <div
                          key={symbol}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg ${bg} text-sm`}
                          title={rsi != null ? `RSI(14)=${rsi}，<30超卖 >70超买` : '计算中'}
                        >
                          <span className="font-medium text-xs">{label}</span>
                          <span className="font-mono font-semibold text-xs">{rsi != null ? rsi : '—'}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
              <div className="pt-2 border-t border-[var(--border)]/50">
                <div className="text-xs text-[var(--muted)]">
                  涨跌口径说明：加密货币“涨跌额/涨跌幅”基于 Binance 24h 滚动统计，参考价为 24h 开盘价。
                </div>
              </div>
            </div>
            <div className="flex gap-2 px-4 py-3 border-b border-[var(--border)]">
              <input
                type="text"
                value={searchCrypto}
                onChange={(e) => setSearchCrypto(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    onAddCrypto(searchCrypto)
                    setSearchCrypto('')
                  }
                }}
                placeholder="输入代号添加，如 BTC 或 BTCUSDT"
                className="flex-1 input-field text-sm"
              />
              <button
                type="button"
                onClick={() => { onAddCrypto(searchCrypto); setSearchCrypto('') }}
                className="btn-primary"
              >
                添加
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-xs text-[var(--muted)] border-b border-[var(--border)] bg-[var(--bg)]/30">
                    <th className="py-3 px-4 font-medium">交易对</th>
                    <th className="py-3 px-4 text-right font-medium">最新价(USDT)</th>
                    <th className="py-3 px-4 text-right font-medium">24h开盘(USDT)</th>
                    <th className="py-3 px-4 text-right font-medium">24h涨跌额(USDT)</th>
                    <th className="py-3 px-4 text-right font-medium">24h涨跌幅</th>
                    <th className="py-3 px-4 text-center font-medium">K线</th>
                    <th className="py-3 px-4 w-10" />
                  </tr>
                </thead>
                <tbody>
                  {cryptoList.map((row) => (
                    <TickerRowComponent
                      key={row.id}
                      row={row}
                      showPrevShowChange
                      sparkPoints={priceHistory[row.id]}
                      onRowClick={setKlineRow}
                      onDelete={() => onRemoveCrypto(row.symbol)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'commodity' && (
          <div>
            <div className="px-5 py-4 border-b border-[var(--border)] bg-[var(--bg)]/30">
              <p className="text-sm text-[var(--muted)]">
                黄金、白银、原油等以美股 ETF 行情展示（如 GLD/SLV/USO），需在设置中配置 Finnhub API Key。
              </p>
            </div>
            <div className="flex gap-2 px-4 py-3 border-b border-[var(--border)]">
              <input
                type="text"
                value={searchCommodity}
                onChange={(e) => setSearchCommodity(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    onAddCommodity(searchCommodity)
                    setSearchCommodity('')
                  }
                }}
                placeholder="输入代码添加，如 GLD SLV USO"
                className="flex-1 input-field text-sm"
              />
              <button
                type="button"
                onClick={() => { onAddCommodity(searchCommodity); setSearchCommodity('') }}
                className="btn-primary"
              >
                添加
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-xs text-[var(--muted)] border-b border-[var(--border)] bg-[var(--bg)]/30">
                    <th className="py-3 px-4 font-medium">名称 / 代码</th>
                    <th className="py-3 px-4 text-right font-medium">最新价(美元)</th>
                    <th className="py-3 px-4 text-right font-medium">前收(美元)</th>
                    <th className="py-3 px-4 text-right font-medium">涨跌额(美元)</th>
                    <th className="py-3 px-4 text-right font-medium">涨跌幅</th>
                    <th className="py-3 px-4 text-center font-medium">K线</th>
                    <th className="py-3 px-4 w-10" />
                  </tr>
                </thead>
                <tbody>
                  {commodityList.map((row) => (
                    <TickerRowComponent
                      key={row.id}
                      row={row}
                      showName
                      showPrevShowChange
                      showSparkline={false}
                      sparkPoints={priceHistory[row.id]}
                      onRowClick={setKlineRow}
                      onDelete={() => onRemoveCommodity(row.symbol)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'bot' && (
          <div className="p-5">
            <BotPanel
              config={botConfig}
              onConfigChange={onBotConfigChange}
              paperState={botPaperState}
              running={botRunning}
              lastSignal={botLastSignal}
              error={botError}
              llmConfig={llmConfig}
              onStart={onBotStart}
              onStop={onBotStop}
            />
          </div>
        )}

        {activeTab === 'research' && (
          <div className="p-5">
            <ResearchPanel />
          </div>
        )}

        {activeTab === 'tender' && (
          <TenderOfferPanel
            list={tenderOfferList}
            loading={tenderOfferLoading}
            error={tenderOfferError}
            hasFinnhub={!!apiKey}
            onRefreshFilings={onTenderOfferRefreshFilings}
            onRefreshPrices={onTenderOfferRefreshPrices}
          />
        )}
      </div>

      {klineRow && (
        <KlineModal row={klineRow} apiKey={apiKey} alphaVantageKey={alphaVantageKey} onClose={() => setKlineRow(null)} />
      )}
    </div>
  )
}
