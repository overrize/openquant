import type { IndexQuote, SentimentBreadth, BehaviorIndicators } from '../api/market'

interface MarketOverviewPanelProps {
  indices: IndexQuote[]
  sentiment: SentimentBreadth | null
  behavior: BehaviorIndicators
  loading: boolean
}

function hasBreadth(sentiment: SentimentBreadth | null): boolean {
  return sentiment != null && sentiment.total > 0
}

function formatPct(n: number): string {
  const sign = n >= 0 ? '+' : ''
  return `${sign}${n.toFixed(2)}%`
}

const BEHAVIOR_CONFIG = [
  { key: 'herd' as const, label: '羊群效应', sub: '追涨/跟风', text: 'text-[var(--oq-warn)]', bg: 'bg-[var(--oq-warn)]' },
  { key: 'anchor' as const, label: '锚定效应', sub: '溢价参考', text: 'text-[var(--oq-info)]', bg: 'bg-[var(--oq-info)]' },
  { key: 'disposition' as const, label: '处置效应', sub: '惜售抗跌', text: 'text-tick-up', bg: 'bg-[var(--oq-up)]' },
  { key: 'attention' as const, label: '注意力效应', sub: '吸金度', text: 'text-[var(--oq-brand-accent)]', bg: 'bg-[var(--oq-brand-accent)]' },
]

export function MarketOverviewPanel({ indices, sentiment, behavior, loading }: MarketOverviewPanelProps) {
  if (loading && indices.length === 0) {
    return (
      <div className="p-8 text-center">
        <div className="inline-flex items-center gap-2 text-[var(--muted)]">
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          正在加载大盘数据…
        </div>
      </div>
    )
  }

  return (
    <div className="p-5 space-y-5">
      {/* Indices */}
      <div>
        <h4 className="text-[10px] font-mono font-semibold text-[var(--muted)] mb-3 uppercase tracking-[0.16em] flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
          </svg>
          股市指数
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {indices.map((idx) => {
            const isUp = idx.change >= 0
            return (
              <div
                key={idx.secid}
                className="glass-card glass-card-hover rounded-xl p-4 transition-all duration-200"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-xs text-[var(--muted)] mb-1">{idx.name}</div>
                    <div className="text-2xl font-semibold font-mono text-[var(--text)] tracking-tight">
                      {idx.price.toFixed(2)}
                    </div>
                  </div>
                  <div className={`text-right ${isUp ? 'text-cn-up' : 'text-cn-down'}`}>
                    <div className="text-sm font-mono font-semibold">
                      {formatPct(idx.changePercent)}
                    </div>
                    <div className="text-xs font-mono opacity-70">
                      {isUp ? '+' : ''}{idx.change.toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Sentiment */}
      <div>
        <h4 className="text-[10px] font-mono font-semibold text-[var(--muted)] mb-3 uppercase tracking-[0.16em] flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 20V10" /><path d="M12 20V4" /><path d="M6 20v-6" />
          </svg>
          市场情绪广度
        </h4>
        <div className="glass-card rounded-xl p-4">
          {sentiment ? (
            <>
              <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm mb-3">
                <span className="text-cn-up font-medium">上涨 {sentiment.up}</span>
                <span className="text-[var(--muted)]">平盘 {sentiment.flat}</span>
                <span className="text-cn-down font-medium">下跌 {sentiment.down}</span>
                <span className="text-cn-up">涨停 {sentiment.limitUp}</span>
                <span className="text-cn-down">跌停 {sentiment.limitDown}</span>
              </div>
              <div className="h-2.5 rounded-full overflow-hidden bg-[var(--bg)] flex">
                <div
                  className="bg-[var(--oq-up)] transition-all duration-500 rounded-l-full"
                  style={{ width: `${(sentiment.up / sentiment.total) * 100}%` }}
                />
                <div
                  className="bg-[var(--muted)]/50 transition-all duration-500"
                  style={{ width: `${(sentiment.flat / sentiment.total) * 100}%` }}
                />
                <div
                  className="bg-[var(--oq-down)] transition-all duration-500 rounded-r-full"
                  style={{ width: `${(sentiment.down / sentiment.total) * 100}%` }}
                />
              </div>
            </>
          ) : (
            <p className="text-sm text-[var(--muted)]">情绪广度数据暂无，仅显示指数与行为指标</p>
          )}
        </div>
      </div>

      {/* Behavior */}
      <div>
        <h4 className="text-[10px] font-mono font-semibold text-[var(--muted)] mb-3 uppercase tracking-[0.16em] flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" /><path d="M8 14s1.5 2 4 2 4-2 4-2" /><line x1="9" y1="9" x2="9.01" y2="9" /><line x1="15" y1="9" x2="15.01" y2="9" />
          </svg>
          行为经济学指标
        </h4>
        {!hasBreadth(sentiment) && (
          <p className="text-xs text-amber-500/80 mb-2">当前无情绪广度数据，追涨意愿、惜售抗跌、吸金度为默认 50。</p>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {BEHAVIOR_CONFIG.map(({ key, label, sub, text, bg }) => (
            <div
              key={key}
              className="glass-card glass-card-hover rounded-xl px-4 py-3 transition-all duration-200"
            >
              <div className="flex items-center justify-between mb-2">
                <div>
                  <span className="text-sm font-medium text-[var(--text)]">{label}</span>
                  <span className="text-xs text-[var(--muted)] ml-1.5">({sub})</span>
                </div>
                <span className={`font-mono font-bold text-lg ${text}`}>{behavior[key]}</span>
              </div>
              <div className="h-1.5 rounded-full bg-[var(--bg)] overflow-hidden">
                <div
                  className={`h-full rounded-full ${bg} transition-all duration-700 ease-out`}
                  style={{ width: `${behavior[key]}%`, opacity: 0.7 }}
                />
              </div>
            </div>
          ))}
        </div>
        <div className="mt-3 text-xs text-[var(--muted)] space-y-0.5 opacity-70">
          <p>· 羊群 = 50 + (上涨占比−0.5)×100 · 锚定 = 50 − |涨跌幅%|×3</p>
          <p>· 处置 = 涨停/(涨停+跌停)×100 · 注意力 = 上涨占比×100</p>
        </div>
      </div>
    </div>
  )
}
