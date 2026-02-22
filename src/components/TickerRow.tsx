import { useEffect, useState } from 'react'
import type { TickerRow as TickerRowType } from '../types'
import { Sparkline } from './Sparkline'

function formatPrice(n: number): string {
  if (n >= 1e6) return (n / 1e6).toFixed(2) + 'M'
  if (n >= 1e3) return n.toFixed(2)
  if (n >= 1) return n.toFixed(2)
  if (n >= 0.01) return n.toFixed(4)
  return n.toFixed(6)
}

function formatPercent(p: number | undefined): string {
  if (p == null || Number.isNaN(p)) return '—'
  const sign = p >= 0 ? '+' : ''
  return `${sign}${p.toFixed(2)}%`
}

function formatChange(c: number | undefined): string {
  if (c == null || Number.isNaN(c)) return '—'
  const sign = c >= 0 ? '+' : '-'
  return sign + formatPrice(Math.abs(c))
}

interface TickerRowProps {
  row: TickerRowType
  showName?: boolean
  /** 是否多列：前收、涨跌额（用于美股/A股标签页） */
  showPrevShowChange?: boolean
  /** 是否显示缩略 K 线列（美股因 Yahoo 403 暂不显示） */
  showSparkline?: boolean
  /** 缩略 K 线用的近期价格序列 */
  sparkPoints?: number[]
  /** 点击行时打开 K 线弹窗 */
  onRowClick?: (row: TickerRowType) => void
  /** 点击删除时从自选移除 */
  onDelete?: () => void
}

export function TickerRow({ row, showName, showPrevShowChange, showSparkline = true, sparkPoints, onRowClick, onDelete }: TickerRowProps) {
  const [flash, setFlash] = useState<'up' | 'down' | null>(row.flash || null)

  useEffect(() => {
    if (!row.flash) return
    setFlash(row.flash)
    const t = setTimeout(() => setFlash(null), 600)
    return () => clearTimeout(t)
  }, [row.flash, row.price])

  const changePercent = row.changePercent ?? (row.prevClose ? ((row.price - row.prevClose) / row.prevClose) * 100 : undefined)
  const changeVal = row.change ?? (row.prevClose && row.price > 0 ? row.price - row.prevClose : undefined)
  const isUp = (changePercent ?? 0) > 0
  const isDown = (changePercent ?? 0) < 0
  const flashClass = flash === 'up' ? 'tick-flash-up' : flash === 'down' ? 'tick-flash-down' : ''

  const symbolCell = showName && row.name ? `${row.symbol} ${row.name}` : row.symbol
  const trProps = {
    role: onRowClick ? 'button' : undefined,
    onClick: onRowClick ? () => onRowClick(row) : undefined,
    className: `border-b border-[var(--border)]/50 ${flashClass} ${onRowClick ? 'cursor-pointer hover:bg-white/5' : ''}`,
  }

  const deleteCell = onDelete ? (
    <td className="py-2.5 px-3 text-center" onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        onClick={onDelete}
        className="text-[var(--muted)] hover:text-red-400 text-sm px-1.5 py-0.5 rounded"
        title="从自选删除"
        aria-label="删除"
      >
        删除
      </button>
    </td>
  ) : (
    <td className="py-2.5 px-3 w-10" />
  )

  if (showPrevShowChange) {
    return (
      <tr {...trProps}>
        <td className="py-2.5 px-3 font-medium text-[var(--text)]">{symbolCell}</td>
        <td className="py-2.5 px-3 text-right tabular-nums">
          {row.price > 0 ? formatPrice(row.price) : '—'}
        </td>
        <td className="py-2.5 px-3 text-right tabular-nums text-[var(--muted)]">
          {row.prevClose != null && row.prevClose > 0 ? formatPrice(row.prevClose) : '—'}
        </td>
        <td className={`py-2.5 px-3 text-right tabular-nums ${
          isUp ? 'text-tick-up' : isDown ? 'text-tick-down' : 'text-tick-flat'
        }`}>
          {formatChange(changeVal)}
        </td>
        <td className={`py-2.5 px-3 text-right tabular-nums ${
          isUp ? 'text-tick-up' : isDown ? 'text-tick-down' : 'text-tick-flat'
        }`}>
          {formatPercent(changePercent)}
        </td>
        {showSparkline && (
          <td className="py-2.5 px-3 text-center align-middle" onClick={(e) => e.stopPropagation()}>
            <Sparkline points={sparkPoints ?? []} width={80} height={28} />
          </td>
        )}
        {deleteCell}
      </tr>
    )
  }

  return (
    <tr {...trProps}>
      <td className="py-2.5 px-3 font-medium text-[var(--text)]">{symbolCell}</td>
      <td className="py-2.5 px-3 text-right tabular-nums">
        {row.price > 0 ? formatPrice(row.price) : '—'}
      </td>
      <td className={`py-2.5 px-3 text-right tabular-nums ${
        isUp ? 'text-tick-up' : isDown ? 'text-tick-down' : 'text-tick-flat'
      }`}>
        {formatPercent(changePercent)}
      </td>
      {deleteCell}
    </tr>
  )
}
