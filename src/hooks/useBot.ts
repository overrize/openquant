/**
 * Bot 主逻辑：拉取 K 线 / 订阅行情 → 运行策略 → 虚拟盘执行
 * - 虚拟盘支持自动交易（本地模拟）
 * - 支持按 bar 或 tick 触发（tick 即较高频）
 */

import { useCallback, useRef, useState, useEffect } from 'react'
import type { BotConfig, PaperState, Signal } from '../bot/types'
import { createInitialPaperState, updatePaperEquity, paperExecute } from '../bot/paperEngine'
import { runStrategy, signalToQuantity } from '../bot/strategy'
import { fetchCryptoKline } from '../api/kline'
import type { KlineBar } from '../api/kline'
import type { LlmFactorConfig } from '../bot/llmFactor'

const BINANCE_WS = 'wss://stream.binance.com:9443/ws'

export function useBot(
  config: BotConfig | null,
  llmConfig: LlmFactorConfig | null
) {
  const [paperState, setPaperState] = useState<PaperState | null>(null)
  const [running, setRunning] = useState(false)
  const [lastSignal, setLastSignal] = useState<Signal | null>(null)
  const [error, setError] = useState<string | null>(null)

  const wsRef = useRef<WebSocket | null>(null)
  const barsRef = useRef<KlineBar[]>([])
  const lastPriceRef = useRef<number>(0)
  const lastBarTimeRef = useRef<number>(0)
  const intervalRef = useRef<number | null>(null)

  const initPaper = useCallback(() => {
    if (!config) return
    setPaperState(createInitialPaperState(config))
  }, [config])

  useEffect(() => {
    if (!config) return
    setPaperState(createInitialPaperState(config))
  }, [config?.symbol, config?.initialBalanceUsdt, config?.interval])

  // 拉取 K 线并更新 barsRef
  const refreshBars = useCallback(async () => {
    if (!config) return
    try {
      const bars = await fetchCryptoKline(config.symbol, config.interval, 100)
      barsRef.current = bars
      if (bars.length > 0) {
        const last = bars[bars.length - 1]
        lastBarTimeRef.current = typeof last.time === 'number' ? last.time * 1000 : new Date(String(last.time)).getTime()
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : '拉取K线失败')
    }
  }, [config?.symbol, config?.interval])

  // 执行一次策略并可能下单
  const runOnce = useCallback(async (price: number) => {
    if (!config || config.mode !== 'paper') return
    const bars = barsRef.current
    const signal = await runStrategy(config, bars, price, config.useLlmFactor ? llmConfig : null)
    setLastSignal(signal)

    setPaperState((prev) => {
      if (!prev || signal.action === 'hold') return prev
      const qty = signalToQuantity(signal, config, prev.balanceUsdt, price)
      if (qty <= 0) return prev
      const next = paperExecute(prev, config.symbol, signal.action, qty, price, config)
      return { ...next, runCount: next.runCount + 1 }
    })
  }, [config, llmConfig])

  // Bar 模式：定时拉 K 线，每次拉取后若新 bar 则跑策略
  useEffect(() => {
    if (!running || !config || config.runFrequency !== 'bar') return
    const ms = config.interval === '1m' ? 60_000 : config.interval === '5m' ? 300_000 : config.interval === '15m' ? 900_000 : config.interval === '1h' ? 3_600_000 : config.interval === '4h' ? 14_400_000 : config.interval === '1d' ? 86_400_000 : 300_000
    const tick = async () => {
      await refreshBars()
      const bars = barsRef.current
      if (bars.length > 0) {
        const last = bars[bars.length - 1]
        const close = last.close
        lastPriceRef.current = close
        await runOnce(close)
      }
    }
    tick()
    intervalRef.current = window.setInterval(tick, ms)
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [running, config?.runFrequency, config?.interval, refreshBars, runOnce])

  // Tick 模式：WebSocket 订阅该 symbol 的逐笔/最新价，每笔或节流后跑策略
  useEffect(() => {
    if (!running || !config || config.runFrequency !== 'tick') return
    const stream = `${config.symbol.toLowerCase()}@ticker`
    const ws = new WebSocket(`${BINANCE_WS}/${stream}`)
    wsRef.current = ws
    let lastRun = 0
    const throttleMs = 2000 // 每 2 秒最多跑一次，避免过于频繁

    ws.onmessage = async (event) => {
      try {
        const msg = JSON.parse(event.data)
        const price = parseFloat(msg.c ?? msg.p ?? 0)
        if (!price) return
        lastPriceRef.current = price
        setPaperState((prev) => (prev ? updatePaperEquity(prev, price) : prev))
        const now = Date.now()
        if (now - lastRun >= throttleMs) {
          lastRun = now
          await refreshBars()
          await runOnce(price)
        }
      } catch {}
    }
    ws.onclose = () => { wsRef.current = null }
    return () => {
      ws.close()
      wsRef.current = null
    }
  }, [running, config?.symbol, config?.runFrequency, refreshBars, runOnce])

  // 非 tick 时也定期更新持仓市值（用 lastPrice）
  useEffect(() => {
    if (!running || !paperState || config?.runFrequency === 'tick') return
    const t = setInterval(() => {
      if (lastPriceRef.current > 0) {
        setPaperState((prev) => (prev ? updatePaperEquity(prev, lastPriceRef.current) : prev))
      }
    }, 5000)
    return () => clearInterval(t)
  }, [running, paperState, config?.runFrequency])

  const start = useCallback(() => {
    setError(null)
    refreshBars().then(() => setRunning(true))
  }, [refreshBars])

  const stop = useCallback(() => {
    setRunning(false)
  }, [])

  return {
    paperState,
    running,
    lastSignal,
    error,
    initPaper,
    start,
    stop,
    refreshBars,
  }
}
