import { useEffect, useRef, useCallback } from 'react'
import type { TickerRow } from '../types'

const FINNHUB_WS = 'wss://ws.finnhub.io'

export function useStockPrices(
  apiKey: string | null,
  symbols: string[],
  onUpdate: (updates: Partial<TickerRow>[]) => void,
  options?: { idPrefix?: string; assetType?: TickerRow['type'] }
) {
  const idPrefix = options?.idPrefix ?? 'stock'
  const assetType = options?.assetType ?? 'stock'
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimerRef = useRef<number | null>(null)
  const manualCloseRef = useRef(false)
  const prevPricesRef = useRef<Record<string, number>>({})
  const onUpdateRef = useRef(onUpdate)
  onUpdateRef.current = onUpdate

  const connect = useCallback(() => {
    if (!apiKey || symbols.length === 0) return
    manualCloseRef.current = false
    if (reconnectTimerRef.current != null) {
      window.clearTimeout(reconnectTimerRef.current)
      reconnectTimerRef.current = null
    }
    const ws = new WebSocket(`${FINNHUB_WS}?token=${apiKey}`)
    wsRef.current = ws

    ws.onopen = () => {
      symbols.forEach((s) => {
        ws.send(JSON.stringify({ type: 'subscribe', symbol: s }))
      })
    }

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        if (data.type !== 'trade' || !Array.isArray(data.data)) return
        for (const t of data.data) {
          const symbol = t.s
          const price = t.p
          const prev = prevPricesRef.current[symbol]
          prevPricesRef.current[symbol] = price
          const flash = prev != null ? (price > prev ? 'up' : price < prev ? 'down' : undefined) : undefined
          onUpdateRef.current([{
            id: `${idPrefix}-${symbol}`,
            type: assetType,
            symbol,
            price,
            lastUpdate: Date.now(),
            flash,
          }])
        }
      } catch {
        // ignore
      }
    }

    ws.onclose = () => {
      wsRef.current = null
      if (manualCloseRef.current) return
      if (reconnectTimerRef.current != null) return
      reconnectTimerRef.current = window.setTimeout(() => {
        reconnectTimerRef.current = null
        if (!manualCloseRef.current) connect()
      }, 5000)
    }
    ws.onerror = () => {}
  }, [apiKey, symbols.join(','), idPrefix, assetType])

  useEffect(() => {
    connect()
    return () => {
      manualCloseRef.current = true
      if (reconnectTimerRef.current != null) {
        window.clearTimeout(reconnectTimerRef.current)
        reconnectTimerRef.current = null
      }
      if (wsRef.current) {
        wsRef.current.close()
        wsRef.current = null
      }
    }
  }, [connect])
}
