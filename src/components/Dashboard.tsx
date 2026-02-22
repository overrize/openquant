import { useState } from 'react'
import type { TickerRow } from '../types'
import { TickerRow as TickerRowComponent } from './TickerRow'
import { KlineModal } from './KlineModal'
import { useMarketOverview, useMarketOverviewUs } from '../hooks/useMarketOverview'
import { useCryptoFearGreed, useCryptoRSI, useAltcoinSeasonIndex } from '../hooks/useCryptoFearGreed'
import { MarketOverviewPanel } from './MarketOverviewPanel'

type TabId = 'us' | 'cn' | 'crypto'

interface DashboardProps {
  stockList: TickerRow[]
  cryptoList: TickerRow[]
  cnStockList: TickerRow[]
  priceHistory: Record<string, number[]>
  apiKey: string | null
  alphaVantageKey: string | null
  onAddStock: (symbol: string) => void
  onRemoveStock: (symbol: string) => void
  onAddCrypto: (symbol: string) => void
  onRemoveCrypto: (symbol: string) => void
  onAddCn: (code: string) => void
  onRemoveCn: (secid: string) => void
}

const TABS: { id: TabId; label: string; freq: string }[] = [
  { id: 'us', label: '美股', freq: '实时 + 报价限频刷新' },
  { id: 'cn', label: 'A股', freq: '约 8 秒刷新' },
  { id: 'crypto', label: '加密货币', freq: '实时' },
]

export function Dashboard({
  stockList,
  cryptoList,
  cnStockList,
  apiKey,
  alphaVantageKey,
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
  const marketOverview = useMarketOverview(activeTab === 'cn')
  const usMarketOverview = useMarketOverviewUs(apiKey, activeTab === 'us')
  const cryptoFearGreed = useCryptoFearGreed(activeTab === 'crypto')
  const cryptoRsiList = useCryptoRSI(
    activeTab === 'crypto' ? cryptoList.map((r) => r.symbol) : [],
    activeTab === 'crypto'
  )
  const altcoinSeasonIndex = useAltcoinSeasonIndex(activeTab === 'crypto')

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex border-b border-[var(--border)] gap-1 mb-4">
        {TABS.map(({ id, label, freq }) => (
          <button
            key={id}
            type="button"
            onClick={() => setActiveTab(id)}
            className={`px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors ${
              activeTab === id
                ? 'bg-[var(--panel)] text-[var(--text)] border border-[var(--border)] border-b-transparent -mb-px'
                : 'text-[var(--muted)] hover:text-[var(--text)] hover:bg-white/5'
            }`}
          >
            {label}
            <span className="ml-1.5 text-xs opacity-75">({freq})</span>
          </button>
        ))}
      </div>

      <div className="bg-[var(--panel)] rounded-xl rounded-tl-none border border-[var(--border)] overflow-hidden">
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
            <div className="flex gap-2 px-4 py-2 border-b border-[var(--border)]">
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
                className="flex-1 px-3 py-1.5 rounded bg-[var(--bg)] border border-[var(--border)] text-[var(--text)] placeholder-[var(--muted)] text-sm"
              />
              <button
                type="button"
                onClick={() => { onAddStock(searchUs); setSearchUs('') }}
                className="px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-700 text-white text-sm"
              >
                添加
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-xs text-[var(--muted)] border-b border-[var(--border)]">
                    <th className="py-2.5 px-3">代码 / 公司</th>
                    <th className="py-2.5 px-3 text-right">最新价(美元)</th>
                    <th className="py-2.5 px-3 text-right">前收(美元)</th>
                    <th className="py-2.5 px-3 text-right">涨跌额(美元)</th>
                    <th className="py-2.5 px-3 text-right">涨跌幅</th>
                    <th className="py-2.5 px-3 w-10" />
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
            <div className="flex gap-2 px-4 py-2 border-b border-[var(--border)]">
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
                className="flex-1 px-3 py-1.5 rounded bg-[var(--bg)] border border-[var(--border)] text-[var(--text)] placeholder-[var(--muted)] text-sm"
              />
              <button
                type="button"
                onClick={() => { onAddCn(searchCn); setSearchCn('') }}
                className="px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-700 text-white text-sm"
              >
                添加
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-xs text-[var(--muted)] border-b border-[var(--border)]">
                    <th className="py-2.5 px-3">代码 / 名称</th>
                    <th className="py-2.5 px-3 text-right">最新价(元)</th>
                    <th className="py-2.5 px-3 text-right">前收(元)</th>
                    <th className="py-2.5 px-3 text-right">涨跌额(元)</th>
                    <th className="py-2.5 px-3 text-right">涨跌幅</th>
                    <th className="py-2.5 px-3 text-center">K线</th>
                    <th className="py-2.5 px-3 w-10" />
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
            <div className="px-4 py-3 border-b border-[var(--border)] space-y-2 bg-[var(--bg)]/50">
              {cryptoList.some((r) => r.symbol === 'BTCUSDT') && (
                <div className="flex flex-wrap items-center gap-4">
                  <span className="text-xs text-[var(--muted)]">市场参考</span>
                  <span className="text-lg font-semibold tabular-nums text-[var(--text)]">BTC (BTCUSDT)</span>
                  <span className="tabular-nums">
                    {(() => {
                      const btc = cryptoList.find((r) => r.symbol === 'BTCUSDT')
                      return btc?.price ? btc.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—'
                    })()}
                  </span>
                  <span className="text-sm text-[var(--muted)]">USDT</span>
                </div>
              )}
              {cryptoFearGreed && (
                <div className="flex flex-wrap items-center gap-4 pt-1 border-t border-[var(--border)]/50">
                  <span className="text-xs text-[var(--muted)]">行为经济学指标</span>
                  <span className="text-sm font-medium text-[var(--text)]">恐慌贪婪指数</span>
                  <span className="tabular-nums font-semibold w-10 text-center">{cryptoFearGreed.value}</span>
                  <span className="text-sm text-[var(--muted)]">{cryptoFearGreed.classification}</span>
                  <span className="text-xs text-[var(--muted)]">0=极度恐慌 100=极度贪婪，极端值可作逆向参考</span>
                </div>
              )}
              {altcoinSeasonIndex != null && (
                <div className="flex flex-wrap items-center gap-4 pt-1 border-t border-[var(--border)]/50">
                  <span className="text-xs text-[var(--muted)]">山寨币季节指数</span>
                  <span className="tabular-nums font-semibold w-10 text-center">{altcoinSeasonIndex}</span>
                  <span className="text-xs text-[var(--muted)]">
                    &gt;75=山寨季（山寨跑赢BTC） &lt;25=比特币季
                  </span>
                </div>
              )}
              {cryptoRsiList.length > 0 && (
                <div className="pt-1 border-t border-[var(--border)]/50">
                  <div className="text-xs text-[var(--muted)] mb-2">RSI(14) 热力图</div>
                  <div className="flex flex-wrap gap-2">
                    {cryptoRsiList.map(({ symbol, rsi }) => {
                      const label = symbol.replace('USDT', '')
                      const rsiNum = rsi ?? 0
                      const bg =
                        rsi == null
                          ? 'bg-[var(--border)]'
                          : rsiNum < 30
                            ? 'bg-green-600/40 text-green-200'
                            : rsiNum > 70
                              ? 'bg-red-600/40 text-red-200'
                              : 'bg-amber-600/30 text-amber-200'
                      return (
                        <div
                          key={symbol}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded ${bg} text-sm`}
                          title={rsi != null ? `RSI(14)=${rsi}，<30超卖 >70超买` : '计算中'}
                        >
                          <span className="font-medium">{label}</span>
                          <span className="tabular-nums">{rsi != null ? rsi : '—'}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
            <div className="flex gap-2 px-4 py-2 border-b border-[var(--border)]">
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
                className="flex-1 px-3 py-1.5 rounded bg-[var(--bg)] border border-[var(--border)] text-[var(--text)] placeholder-[var(--muted)] text-sm"
              />
              <button
                type="button"
                onClick={() => { onAddCrypto(searchCrypto); setSearchCrypto('') }}
                className="px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-700 text-white text-sm"
              >
                添加
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-xs text-[var(--muted)] border-b border-[var(--border)]">
                    <th className="py-2.5 px-3">交易对</th>
                    <th className="py-2.5 px-3 text-right">最新价(USDT)</th>
                    <th className="py-2.5 px-3 text-right">前收(USDT)</th>
                    <th className="py-2.5 px-3 text-right">涨跌额(USDT)</th>
                    <th className="py-2.5 px-3 text-right">涨跌幅</th>
                    <th className="py-2.5 px-3 text-center">K线</th>
                    <th className="py-2.5 px-3 w-10" />
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

      </div>

      {klineRow && (
        <KlineModal row={klineRow} apiKey={apiKey} alphaVantageKey={alphaVantageKey} onClose={() => setKlineRow(null)} />
      )}
    </div>
  )
}
