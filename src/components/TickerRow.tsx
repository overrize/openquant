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
  showPrevShowChange?: boolean
  showSparkline?: boolean
  sparkPoints?: number[]
  onRowClick?: (row: TickerRowType) => void
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

  const symbolCell = (
    <div className="flex items-center gap-2">
      <span className="font-mono font-semibold text-[var(--text)]">{row.symbol}</span>
      {showName && row.name && (
        <span className="text-xs text-[var(--muted)]">{row.name}</span>
      )}
    </div>
  )

  const trProps = {
    role: onRowClick ? 'button' as const : undefined,
    onClick: onRowClick ? () => onRowClick(row) : undefined,
    className: `border-b border-[var(--border)]/40 ${flashClass} transition-colors duration-150 ${onRowClick ? 'cursor-pointer hover:bg-[var(--panel-hover)]' : ''}`,
  }

  const deleteCell = onDelete ? (
    <td className="py-3 px-4 text-center" onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        onClick={onDelete}
        className="text-[var(--muted)] hover:text-red-400 transition-colors p-1 rounded-md hover:bg-red-500/10"
        title="从自选删除"
        aria-label="删除"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </td>
  ) : (
    <td className="py-3 px-4 w-10" />
  )

  const changeColorClass = isUp ? 'text-tick-up' : isDown ? 'text-tick-down' : 'text-tick-flat'

  if (showPrevShowChange) {
    return (
      <tr {...trProps}>
        <td className="py-3 px-4">{symbolCell}</td>
        <td className="py-3 px-4 text-right font-mono tabular-nums text-[var(--text)]">
          {row.price > 0 ? formatPrice(row.price) : '—'}
        </td>
        <td className="py-3 px-4 text-right font-mono tabular-nums text-[var(--muted)]">
          {row.prevClose != null && row.prevClose > 0 ? formatPrice(row.prevClose) : '—'}
        </td>
        <td className={`py-3 px-4 text-right font-mono tabular-nums ${changeColorClass}`}>
          {formatChange(changeVal)}
        </td>
        <td className={`py-3 px-4 text-right font-mono tabular-nums font-medium ${changeColorClass}`}>
          <span className={`inline-block px-2 py-0.5 rounded-md text-xs ${
            isUp ? 'bg-emerald-500/15' : isDown ? 'bg-red-500/15' : ''
          }`}>
            {formatPercent(changePercent)}
          </span>
        </td>
        {showSparkline && (
          <td className="py-3 px-4 text-center align-middle" onClick={(e) => e.stopPropagation()}>
            <Sparkline points={sparkPoints ?? []} width={80} height={28} />
          </td>
        )}
        {deleteCell}
      </tr>
    )
  }

  return (
    <tr {...trProps}>
      <td className="py-3 px-4">{symbolCell}</td>
      <td className="py-3 px-4 text-right font-mono tabular-nums text-[var(--text)]">
        {row.price > 0 ? formatPrice(row.price) : '—'}
      </td>
      <td className={`py-3 px-4 text-right font-mono tabular-nums font-medium ${changeColorClass}`}>
        <span className={`inline-block px-2 py-0.5 rounded-md text-xs ${
          isUp ? 'bg-emerald-500/15' : isDown ? 'bg-red-500/15' : ''
        }`}>
          {formatPercent(changePercent)}
        </span>
      </td>
      {deleteCell}
    </tr>
  )
}
