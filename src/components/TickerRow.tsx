import { useEffect, useState } from 'react'
import type { TickerRow as TickerRowType } from '../types'

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

export function TickerRow({ row, showName }: { row: TickerRowType; showName?: boolean }) {
  const [flash, setFlash] = useState<'up' | 'down' | null>(row.flash || null)

  useEffect(() => {
    if (!row.flash) return
    setFlash(row.flash)
    const t = setTimeout(() => setFlash(null), 600)
    return () => clearTimeout(t)
  }, [row.flash, row.price])

  const changePercent = row.changePercent ?? (row.prevClose ? ((row.price - row.prevClose) / row.prevClose) * 100 : undefined)
  const isUp = (changePercent ?? 0) > 0
  const isDown = (changePercent ?? 0) < 0
  const flashClass = flash === 'up' ? 'tick-flash-up' : flash === 'down' ? 'tick-flash-down' : ''

  const symbolCell = showName && row.name ? `${row.symbol} ${row.name}` : row.symbol

  return (
    <tr className={`border-b border-[var(--border)]/50 ${flashClass}`}>
      <td className="py-2.5 px-3 font-medium text-[var(--text)]">{symbolCell}</td>
      <td className="py-2.5 px-3 text-right tabular-nums">
        {row.price > 0 ? formatPrice(row.price) : '—'}
      </td>
      <td className={`py-2.5 px-3 text-right tabular-nums ${
        isUp ? 'text-tick-up' : isDown ? 'text-tick-down' : 'text-tick-flat'
      }`}>
        {formatPercent(changePercent)}
      </td>
    </tr>
  )
}
