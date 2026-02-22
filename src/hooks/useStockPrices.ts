import { useEffect, useRef, useCallback } from 'react'
import type { TickerRow } from '../types'

const FINNHUB_WS = 'wss://ws.finnhub.io'

export function useStockPrices(
  apiKey: string | null,
  symbols: string[],
  onUpdate: (updates: Partial<TickerRow>[]) => void
) {
  const wsRef = useRef<WebSocket | null>(null)
  const prevPricesRef = useRef<Record<string, number>>({})
  const onUpdateRef = useRef(onUpdate)
  onUpdateRef.current = onUpdate

  const connect = useCallback(() => {
    if (!apiKey || symbols.length === 0) return
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
            id: `stock-${symbol}`,
            type: 'stock',
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
      setTimeout(connect, 5000)
    }
    ws.onerror = () => {}
  }, [apiKey, symbols.join(',')])

  useEffect(() => {
    connect()
    return () => {
      if (wsRef.current) {
        wsRef.current.close()
        wsRef.current = null
      }
    }
  }, [connect])
}
