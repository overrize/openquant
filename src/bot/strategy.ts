/**
 * 策略层：基于 K 线或最新价计算信号
 * - MA 金叉/死叉
 * - 可选：叠加 LLM 因子
 */

import type { KlineBar } from '../api/kline'
import type { BotConfig, Signal } from './types'
import { fetchLlmFactor } from './llmFactor'
import type { LlmFactorConfig } from './llmFactor'
import type { MarketSummary } from './llmFactor'

function ma(closes: number[], period: number): number | null {
  if (closes.length < period) return null
  const slice = closes.slice(-period)
  return slice.reduce((a, b) => a + b, 0) / slice.length
}

/**
 * 基于 K 线序列的 MA 金叉/死叉信号
 */
export function computeMaCrossSignal(
  bars: KlineBar[],
  fastPeriod: number,
  slowPeriod: number
): Signal {
  const closes = bars.map((b) => b.close)
  const maF = ma(closes, fastPeriod)
  const maS = ma(closes, slowPeriod)
  if (maF == null || maS == null) return { action: 'hold' }
  const prevMaF = ma(closes.slice(0, -1), fastPeriod)
  const prevMaS = ma(closes.slice(0, -1), slowPeriod)
  if (prevMaF == null || prevMaS == null) return { action: 'hold' }
  const crossUp = prevMaF <= prevMaS && maF > maS
  const crossDown = prevMaF >= prevMaS && maF < maS
  if (crossUp) return { action: 'buy', reason: `MA${fastPeriod}上穿MA${slowPeriod}` }
  if (crossDown) return { action: 'sell', reason: `MA${fastPeriod}下穿MA${slowPeriod}` }
  return { action: 'hold' }
}

/**
 * 仅用最新价（tick）时没有历史 K 线，可用简单规则或仅 LLM
 * 这里用「最近一次 bar 的收盘与当前价」做简易趋势：若当前价 > 上一 bar 收则偏多
 */
export function computeTickSignal(
  currentPrice: number,
  lastBarClose: number | undefined
): Signal {
  if (lastBarClose == null) return { action: 'hold' }
  const diff = (currentPrice - lastBarClose) / lastBarClose
  if (diff > 0.002) return { action: 'buy', reason: '价在上一根K线之上' }
  if (diff < -0.002) return { action: 'sell', reason: '价在上一根K线之下' }
  return { action: 'hold' }
}

/**
 * 综合策略：bar 模式用 MA；若启用 LLM 则请求 LLM 并可与 MA 组合（此处简化为 LLM 覆盖或与 MA 一致时加强）
 */
export async function runStrategy(
  config: BotConfig,
  bars: KlineBar[],
  currentPrice: number,
  llmConfig: LlmFactorConfig | null
): Promise<Signal> {
  let signal: Signal = { action: 'hold' }

  if (config.runFrequency === 'bar' && bars.length >= Math.max(config.maFast, config.maSlow) + 1) {
    signal = computeMaCrossSignal(bars, config.maFast, config.maSlow)
  }

  if (config.useLlmFactor && llmConfig) {
    const summary: MarketSummary = {
      symbol: config.symbol,
      currentPrice,
      recentBars: bars.slice(-20).map((b) => ({ o: b.open, h: b.high, l: b.low, c: b.close })),
    }
    const llm = await fetchLlmFactor(llmConfig, summary)
    if (llm) {
      signal = {
        action: llm.signal === 'buy' ? 'buy' : llm.signal === 'sell' ? 'sell' : 'hold',
        llmScore: llm.score,
        reason: signal.reason ? `${signal.reason} | LLM=${llm.score.toFixed(2)}` : `LLM=${llm.score.toFixed(2)}`,
      }
      // 若 MA 与 LLM 同向，保留；若仅 LLM 有信号也可用
      if (signal.action === 'hold' && (llm.score > 0.2 || llm.score < -0.2)) {
        signal = {
          action: llm.score > 0.2 ? 'buy' : 'sell',
          llmScore: llm.score,
          reason: `LLM=${llm.score.toFixed(2)}`,
        }
      }
    }
  }

  return signal
}

/**
 * 根据信号与配置计算建议下单量（base 币数量）
 */
export function signalToQuantity(
  signal: Signal,
  config: BotConfig,
  balanceUsdt: number,
  currentPrice: number
): number {
  if (signal.action === 'hold' || currentPrice <= 0) return 0
  const amountUsdt = balanceUsdt * config.positionSizeRatio
  const qty = amountUsdt / currentPrice
  return Math.max(0, qty)
}
