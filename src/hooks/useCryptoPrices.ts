import { useEffect, useRef, useCallback } from 'react'
import type { TickerRow } from '../types'

const BINANCE_WS = 'wss://stream.binance.com:9443/stream'

export function useCryptoPrices(
  symbols: string[],
  onUpdate: (updates: Partial<TickerRow>[]) => void
) {
  const wsRef = useRef<WebSocket | null>(null)
  const prevPricesRef = useRef<Record<string, number>>({})
  const onUpdateRef = useRef(onUpdate)
  onUpdateRef.current = onUpdate

  const connect = useCallback(() => {
    if (symbols.length === 0) return
    const streamNames = symbols.map((s) => `${s.toLowerCase()}@ticker`).join('/')
    const ws = new WebSocket(`${BINANCE_WS}?streams=${streamNames}`)
    wsRef.current = ws

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data)
        const { s: symbol, c: priceStr, P: changePercentStr, p: priceChangeStr } = msg.data || {}
        if (!symbol) return
        const price = parseFloat(priceStr)
        const changePercent = parseFloat(changePercentStr)
        const priceChange = parseFloat(priceChangeStr)
        const prev = prevPricesRef.current[symbol]
        prevPricesRef.current[symbol] = price
        const flash = prev != null ? (price > prev ? 'up' : price < prev ? 'down' : undefined) : undefined
        onUpdateRef.current([{
          id: `crypto-${symbol}`,
          type: 'crypto',
          symbol,
          price,
          changePercent,
          change: priceChange,
          lastUpdate: Date.now(),
          flash,
        }])
      } catch {
        // ignore parse errors
      }
    }

    ws.onclose = () => {
      wsRef.current = null
      setTimeout(connect, 3000)
    }
    ws.onerror = () => {}
  }, [symbols.join(',')])

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
