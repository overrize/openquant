/**
 * 要约收购套利面板
 * 展示 SEC EDGAR 近期 Tender Offer 申报，当前价与价差（需 Finnhub），并链到 SEC 文件
 */

import type { TenderOfferItem } from '../api/tenderOffer'

interface TenderOfferPanelProps {
  list: TenderOfferItem[]
  loading: boolean
  error: string | null
  hasFinnhub: boolean
  onRefreshFilings: () => void
  onRefreshPrices: () => void
}

export function TenderOfferPanel({
  list,
  loading,
  error,
  hasFinnhub,
  onRefreshFilings,
  onRefreshPrices,
}: TenderOfferPanelProps) {
  return (
    <div className="space-y-4 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-[var(--text)]">要约收购套利扫描</h2>
          <p className="text-xs text-[var(--muted)] mt-1">
            数据来源：SEC EDGAR（SC TO-I / SC TO-T）。要约价、截止日与 Odd-Lot 优先权需在 SEC 文件中核实。
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onRefreshFilings}
            disabled={loading}
            className="px-3 py-1.5 rounded-lg border border-[var(--border)] hover:bg-[var(--bg)] text-sm text-[var(--text)] disabled:opacity-50"
          >
            {loading ? '加载中…' : '刷新申报列表'}
          </button>
          {hasFinnhub && (
            <button
              type="button"
              onClick={onRefreshPrices}
              disabled={loading}
              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm disabled:opacity-50"
            >
              获取当前股价
            </button>
          )}
        </div>
      </div>

      {!hasFinnhub && (
        <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-2 text-sm text-amber-200">
          在「设置」中填写 Finnhub API Key 后可自动获取当前股价并估算价差。
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-2 text-sm text-red-200">
          {error}
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[var(--muted)] border-b border-[var(--border)] bg-[var(--bg)]/50">
              <th className="py-3 px-4 font-medium">股票</th>
              <th className="py-3 px-4 font-medium">公司 / 申报类型</th>
              <th className="py-3 px-4 font-medium">申报日</th>
              <th className="py-3 px-4 text-right font-medium">当前价</th>
              <th className="py-3 px-4 text-right font-medium">价差%</th>
              <th className="py-3 px-4 font-medium">SEC 文件</th>
            </tr>
          </thead>
          <tbody>
            {list.length === 0 && !loading && (
              <tr>
                <td colSpan={6} className="py-8 text-center text-[var(--muted)]">
                  暂无申报或加载失败，请点击「刷新申报列表」重试。
                </td>
              </tr>
            )}
            {list.map((item) => (
              <tr
                key={`${item.cik}-${item.filingDate}`}
                className="border-b border-[var(--border)]/50 hover:bg-[var(--bg)]/30"
              >
                <td className="py-2.5 px-4 font-medium text-[var(--text)]">{item.ticker}</td>
                <td className="py-2.5 px-4">
                  <span className="text-[var(--text)]">{item.companyName.slice(0, 40)}{item.companyName.length > 40 ? '…' : ''}</span>
                  <span className="ml-2 text-xs text-[var(--muted)]">{item.filingType}</span>
                </td>
                <td className="py-2.5 px-4 text-[var(--text)]">{item.filingDate}</td>
                <td className="py-2.5 px-4 text-right tabular-nums text-[var(--text)]">
                  {item.currentPrice != null ? `$${item.currentPrice.toFixed(2)}` : '—'}
                </td>
                <td className="py-2.5 px-4 text-right tabular-nums">
                  {item.spreadPct != null ? (
                    <span className={item.spreadPct >= 0 ? 'text-green-500' : 'text-red-500'}>
                      {item.spreadPct >= 0 ? '+' : ''}{item.spreadPct.toFixed(1)}%
                    </span>
                  ) : (
                    <span className="text-[var(--muted)]">—</span>
                  )}
                </td>
                <td className="py-2.5 px-4">
                  <a
                    href={item.filingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:underline text-xs"
                  >
                    查看
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="rounded-lg border border-[var(--border)] bg-[var(--panel)] p-4 text-xs text-[var(--muted)] space-y-2">
        <div className="font-medium text-[var(--text)]">套利要点</div>
        <ul className="list-disc list-inside space-y-1">
          <li><strong>Tender Offer</strong>：公司或第三方以溢价向股东收购股份，SEC 申报类型为 SC TO-I（发行人回购）或 SC TO-T（第三方收购）。</li>
          <li><strong>Odd-Lot 优先权</strong>：持有 &lt;100 股的股东常可免受按比例缩减(proration)，需在 SEC 文件中搜索 “odd lot”“fewer than 100 shares” 等确认。</li>
          <li><strong>价差</strong>：要约价 − 当前股价；本页价差需在 SEC 文件中确认要约价后自行计算，或使用「获取当前股价」后若已维护要约价则显示。</li>
        </ul>
      </div>
    </div>
  )
}
