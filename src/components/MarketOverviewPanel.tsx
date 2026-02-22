/**
 * 大盘全局视野：指数、市场情绪广度、行为经济学指标，参考截图 UI 持续展示
 */
import type { IndexQuote, SentimentBreadth, BehaviorIndicators } from '../api/market'

interface MarketOverviewPanelProps {
  indices: IndexQuote[]
  sentiment: SentimentBreadth | null
  behavior: BehaviorIndicators
  loading: boolean
}

function formatPct(n: number): string {
  const sign = n >= 0 ? '+' : ''
  return `${sign}${n.toFixed(2)}%`
}

export function MarketOverviewPanel({ indices, sentiment, behavior, loading }: MarketOverviewPanelProps) {
  if (loading && indices.length === 0) {
    return (
      <div className="p-6 text-center text-[var(--muted)]">
        正在加载大盘数据…
      </div>
    )
  }

  return (
    <div className="p-4 space-y-6">
      <div>
        <h4 className="text-sm font-medium text-[var(--muted)] mb-3">对应股市指数</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {indices.map((idx) => {
            const isUp = idx.change >= 0
            return (
              <div
                key={idx.secid}
                className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-4"
              >
                <div className="text-xs text-[var(--muted)] mb-1">{idx.name}</div>
                <div className="text-2xl font-bold text-[var(--text)] tabular-nums">
                  {idx.price.toFixed(2)}
                </div>
                <div
                  className={`text-sm tabular-nums mt-1 ${isUp ? 'text-tick-up' : 'text-tick-down'}`}
                >
                  {isUp ? '+' : ''}{idx.change.toFixed(2)} {formatPct(idx.changePercent)}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div>
        <h4 className="text-sm font-medium text-[var(--muted)] mb-3">市场情绪广度</h4>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-4">
          {sentiment ? (
            <>
              <div className="flex flex-wrap gap-4 text-sm">
                <span className="text-tick-up">上涨: {sentiment.up}</span>
                <span className="text-[var(--muted)]">平盘: {sentiment.flat}</span>
                <span className="text-tick-down">下跌: {sentiment.down}</span>
                <span className="text-tick-up">涨停: {sentiment.limitUp}</span>
                <span className="text-tick-down">跌停: {sentiment.limitDown}</span>
              </div>
              <div className="mt-3 h-2 rounded-full overflow-hidden bg-[var(--panel)] flex">
                <div
                  className="bg-tick-up transition-all"
                  style={{ width: `${(sentiment.up / sentiment.total) * 100}%` }}
                />
                <div
                  className="bg-[var(--muted)] transition-all"
                  style={{ width: `${(sentiment.flat / sentiment.total) * 100}%` }}
                />
                <div
                  className="bg-tick-down transition-all"
                  style={{ width: `${(sentiment.down / sentiment.total) * 100}%` }}
                />
              </div>
            </>
          ) : (
            <p className="text-sm text-[var(--muted)]">情绪广度数据暂无，仅显示指数与行为指标</p>
          )}
        </div>
      </div>

      <div>
        <h4 className="text-sm font-medium text-[var(--muted)] mb-3">行为经济学指标</h4>
        <p className="text-xs text-[var(--muted)] mb-3">
          由指数与情绪广度实时推算，数值 0–100，便于观察因子影响与决策参考
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { key: 'herd' as const, label: '羊群效应(追涨意愿)', value: behavior.herd, color: 'text-yellow-400' },
            { key: 'anchor' as const, label: '锚定效应(溢价参考)', value: behavior.anchor, color: 'text-orange-400' },
            { key: 'disposition' as const, label: '处置效应(惜售抗跌)', value: behavior.disposition, color: 'text-green-400' },
            { key: 'attention' as const, label: '注意力效应(吸金度)', value: behavior.attention, color: 'text-blue-400' },
          ].map(({ key, label, value, color }) => (
            <div
              key={key}
              className="rounded-lg border border-[var(--border)] bg-[var(--bg)] px-4 py-3 flex items-center justify-between"
            >
              <span className="text-sm text-[var(--text)]">{label}</span>
              <div className="flex items-center gap-2">
                <div className="w-16 h-1.5 rounded-full bg-[var(--panel)] overflow-hidden">
                  <div
                    className={`h-full rounded-full ${key === 'herd' ? 'bg-yellow-500' : key === 'anchor' ? 'bg-orange-500' : key === 'disposition' ? 'bg-green-500' : 'bg-blue-500'}`}
                    style={{ width: `${value}%` }}
                  />
                </div>
                <span className={`tabular-nums font-medium w-8 text-right ${color}`}>{value}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-3 text-xs text-[var(--muted)] space-y-1">
          <p>· 羊群：涨跌家数趋同度代理，高=跟风强(横截面趋同)</p>
          <p>· 锚定：指数波动偏离参考点，高=仍依赖锚定</p>
          <p>· 处置：涨停/(涨停+跌停)，高=惜售强</p>
          <p>· 注意力：上涨家数占比，高=资金关注集中</p>
        </div>
      </div>
    </div>
  )
}
