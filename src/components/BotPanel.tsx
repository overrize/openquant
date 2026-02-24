import { useMemo } from 'react'
import type { BotConfig, PaperState, Signal } from '../bot/types'
import type { LlmFactorConfig } from '../bot/llmFactor'

interface BotPanelProps {
  config: BotConfig
  onConfigChange: (c: Partial<BotConfig>) => void
  paperState: PaperState | null
  running: boolean
  lastSignal: Signal | null
  error: string | null
  llmConfig: LlmFactorConfig | null
  onStart: () => void
  onStop: () => void
}

export function BotPanel({
  config,
  onConfigChange,
  paperState,
  running,
  lastSignal,
  error,
  llmConfig,
  onStart,
  onStop,
}: BotPanelProps) {
  const pnlTotal = useMemo(() => {
    if (!paperState?.trades.length) return 0
    return paperState.trades.reduce((s, t) => s + (t.pnl ?? 0), 0)
  }, [paperState?.trades])

  return (
    <div className="space-y-5 animate-fadeIn">
      <div className="glass-card rounded-xl p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500/30 to-emerald-500/30 border border-green-500/20 flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-400">
              <rect x="3" y="11" width="18" height="10" rx="2" /><circle cx="12" cy="5" r="2" /><path d="M12 7v4" />
            </svg>
          </div>
          <div>
            <h2 className="text-base font-semibold text-[var(--text)]">自动交易 Bot（虚拟盘）</h2>
            <p className="text-xs text-[var(--muted)]">
              本地模拟盈亏 · 无需 API Key · 高频支持 Tick 驱动
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-[var(--muted)]">交易对</span>
            <input
              type="text"
              value={config.symbol}
              onChange={(e) => onConfigChange({ symbol: e.target.value.trim().toUpperCase() || 'BTCUSDT' })}
              placeholder="BTCUSDT"
              className="input-field text-sm font-mono"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-[var(--muted)]">K 线周期</span>
            <select
              value={config.interval}
              onChange={(e) => onConfigChange({ interval: e.target.value as BotConfig['interval'] })}
              className="input-field text-sm"
            >
              <option value="1m">1 分钟</option>
              <option value="5m">5 分钟</option>
              <option value="15m">15 分钟</option>
              <option value="1h">1 小时</option>
              <option value="4h">4 小时</option>
              <option value="1d">1 天</option>
            </select>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-[var(--muted)]">运行频率</span>
            <select
              value={config.runFrequency}
              onChange={(e) => onConfigChange({ runFrequency: e.target.value as BotConfig['runFrequency'] })}
              className="input-field text-sm"
            >
              <option value="bar">按 K 线收盘 (bar)</option>
              <option value="tick">按行情推送 (tick)</option>
            </select>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-[var(--muted)]">初始资金 (USDT)</span>
            <input
              type="number"
              min={100}
              step={1000}
              value={config.initialBalanceUsdt}
              onChange={(e) => onConfigChange({ initialBalanceUsdt: Number(e.target.value) || 10000 })}
              className="input-field text-sm font-mono"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-[var(--muted)]">仓位比例 (0.01~1)</span>
            <input
              type="number"
              min={0.01}
              max={1}
              step={0.05}
              value={config.positionSizeRatio}
              onChange={(e) => onConfigChange({ positionSizeRatio: Number(e.target.value) || 0.1 })}
              className="input-field text-sm font-mono"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-[var(--muted)]">MA 快线 / 慢线</span>
            <div className="flex gap-2">
              <input
                type="number"
                min={2}
                max={50}
                value={config.maFast}
                onChange={(e) => onConfigChange({ maFast: Number(e.target.value) || 9 })}
                className="flex-1 input-field text-sm font-mono"
              />
              <input
                type="number"
                min={2}
                max={100}
                value={config.maSlow}
                onChange={(e) => onConfigChange({ maSlow: Number(e.target.value) || 21 })}
                className="flex-1 input-field text-sm font-mono"
              />
            </div>
          </label>
          <label className="flex items-center gap-2.5 sm:col-span-2">
            <input
              type="checkbox"
              checked={config.useLlmFactor}
              onChange={(e) => onConfigChange({ useLlmFactor: e.target.checked })}
              className="w-4 h-4 rounded border-[var(--border)] bg-[var(--bg)] accent-blue-500"
            />
            <span className="text-sm text-[var(--text)]">启用大模型因子</span>
            {config.useLlmFactor && !llmConfig?.apiKey && (
              <span className="text-amber-500 text-xs">请在设置中配置 LLM API</span>
            )}
          </label>
        </div>

        <div className="mt-4 flex items-center gap-3">
          {running ? (
            <button type="button" onClick={onStop} className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white text-sm font-medium transition-all duration-200 hover:shadow-lg hover:shadow-red-500/20">
              停止 Bot
            </button>
          ) : (
            <button type="button" onClick={onStart} className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-green-500 hover:from-emerald-700 hover:to-green-600 text-white text-sm font-medium transition-all duration-200 hover:shadow-lg hover:shadow-emerald-500/20">
              启动 Bot
            </button>
          )}
          {running && (
            <div className="flex items-center gap-2 text-xs text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              运行中
            </div>
          )}
          {error && <span className="text-red-400 text-sm">{error}</span>}
        </div>
      </div>

      {(paperState || lastSignal) && (
        <div className="glass-card rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-semibold text-[var(--text)] flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 20V10" /><path d="M18 20V4" /><path d="M6 20v-6" />
            </svg>
            账户与信号
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
            {paperState && (
              <>
                <div className="glass-card rounded-lg p-3">
                  <div className="text-xs text-[var(--muted)] mb-1">余额</div>
                  <div className="font-mono font-semibold text-[var(--text)]">{paperState.balanceUsdt.toFixed(2)}</div>
                  <div className="text-xs text-[var(--muted)]">USDT</div>
                </div>
                <div className="glass-card rounded-lg p-3">
                  <div className="text-xs text-[var(--muted)] mb-1">净值</div>
                  <div className="font-mono font-semibold text-[var(--text)]">{paperState.equity.toFixed(2)}</div>
                  <div className="text-xs text-[var(--muted)]">USDT</div>
                </div>
                <div className="glass-card rounded-lg p-3">
                  <div className="text-xs text-[var(--muted)] mb-1">累计盈亏</div>
                  <div className={`font-mono font-semibold ${pnlTotal >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {pnlTotal >= 0 ? '+' : ''}{pnlTotal.toFixed(2)}
                  </div>
                  <div className="text-xs text-[var(--muted)]">USDT</div>
                </div>
              </>
            )}
            {lastSignal && (
              <div className="glass-card rounded-lg p-3">
                <div className="text-xs text-[var(--muted)] mb-1">最新信号</div>
                <div className={`font-semibold ${
                  lastSignal.action === 'buy' ? 'text-emerald-400' : lastSignal.action === 'sell' ? 'text-red-400' : 'text-[var(--muted)]'
                }`}>
                  {lastSignal.action === 'buy' ? '买入' : lastSignal.action === 'sell' ? '卖出' : '观望'}
                </div>
                {lastSignal.llmScore != null && (
                  <div className="text-xs text-[var(--muted)]">LLM: {lastSignal.llmScore.toFixed(2)}</div>
                )}
              </div>
            )}
          </div>
          {lastSignal?.reason && (
            <p className="text-xs text-[var(--muted)] glass-card rounded-lg px-3 py-2">{lastSignal.reason}</p>
          )}
        </div>
      )}

      {paperState && paperState.positions.length > 0 && (
        <div className="glass-card rounded-xl p-5">
          <h3 className="text-sm font-semibold text-[var(--text)] mb-3 flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="7" width="20" height="14" rx="2" ry="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
            </svg>
            持仓
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-[var(--muted)] border-b border-[var(--border)]">
                  <th className="py-2 px-3 font-medium">交易对</th>
                  <th className="py-2 px-3 font-medium">方向</th>
                  <th className="py-2 px-3 text-right font-medium">数量</th>
                  <th className="py-2 px-3 text-right font-medium">开仓均价</th>
                </tr>
              </thead>
              <tbody>
                {paperState.positions.map((p) => (
                  <tr key={`${p.symbol}-${p.side}`} className="border-b border-[var(--border)]/40">
                    <td className="py-2 px-3 font-mono">{p.symbol}</td>
                    <td className="py-2 px-3">
                      <span className={`text-xs px-2 py-0.5 rounded ${p.side === 'long' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'}`}>
                        {p.side === 'long' ? '多' : '空'}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-right font-mono tabular-nums">{p.quantity}</td>
                    <td className="py-2 px-3 text-right font-mono tabular-nums">{p.avgPrice.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {paperState && paperState.trades.length > 0 && (
        <div className="glass-card rounded-xl p-5">
          <h3 className="text-sm font-semibold text-[var(--text)] mb-3 flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
            </svg>
            最近成交
          </h3>
          <div className="max-h-48 overflow-y-auto text-xs">
            <table className="w-full">
              <thead>
                <tr className="text-left text-[var(--muted)] border-b border-[var(--border)]">
                  <th className="py-1.5 px-2 font-medium">时间</th>
                  <th className="py-1.5 px-2 font-medium">方向</th>
                  <th className="py-1.5 px-2 text-right font-medium">数量</th>
                  <th className="py-1.5 px-2 text-right font-medium">价格</th>
                  <th className="py-1.5 px-2 text-right font-medium">盈亏</th>
                </tr>
              </thead>
              <tbody>
                {[...paperState.trades].reverse().slice(0, 20).map((t) => (
                  <tr key={t.id} className="border-b border-[var(--border)]/30">
                    <td className="py-1.5 px-2 text-[var(--muted)]">{new Date(t.time).toLocaleTimeString()}</td>
                    <td className="py-1.5 px-2">
                      <span className={t.side === 'buy' ? 'text-emerald-400' : 'text-red-400'}>
                        {t.side === 'buy' ? '买' : '卖'}
                      </span>
                    </td>
                    <td className="py-1.5 px-2 text-right font-mono tabular-nums">{t.quantity}</td>
                    <td className="py-1.5 px-2 text-right font-mono tabular-nums">{t.price.toFixed(2)}</td>
                    <td className="py-1.5 px-2 text-right font-mono tabular-nums">
                      {t.pnl != null ? (
                        <span className={t.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                          {t.pnl >= 0 ? '+' : ''}{t.pnl.toFixed(2)}
                        </span>
                      ) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
