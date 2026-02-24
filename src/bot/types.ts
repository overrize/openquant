/**
 * 自动交易 Bot 类型定义
 * - 支持虚拟盘（模拟）与实盘（需后端签名，当前仅实现虚拟盘）
 * - 支持按 K 线周期或按 Tick 驱动（较高频）
 */

export type BotMode = 'paper' | 'live'
export type StrategyType = 'ma_cross' | 'ma_cross_llm'
export type SignalAction = 'buy' | 'sell' | 'hold'

/** K 线周期，与 Binance 一致 */
export type BotKlineInterval = '1m' | '5m' | '15m' | '1h' | '4h' | '1d'

/** 策略运行频率：按每笔成交(tick) 或 按 K 线收盘(bar) */
export type RunFrequency = 'tick' | 'bar'

export interface BotConfig {
  symbol: string
  interval: BotKlineInterval
  strategy: StrategyType
  /** 运行频率：tick=每笔行情触发（较高频），bar=每根K线收盘触发 */
  runFrequency: RunFrequency
  mode: BotMode
  /** 初始虚拟 USDT（仅 paper 有效） */
  initialBalanceUsdt: number
  /** 每笔交易占余额比例 (0.01~1) */
  positionSizeRatio: number
  /** MA 快线周期（仅 ma_cross） */
  maFast: number
  /** MA 慢线周期（仅 ma_cross） */
  maSlow: number
  /** 是否启用 LLM 因子（需在设置中配置 API） */
  useLlmFactor: boolean
}

export interface Position {
  symbol: string
  side: 'long' | 'short'
  quantity: number
  /** 开仓均价 */
  avgPrice: number
  /** 开仓时间戳 */
  openTime: number
}

export interface TradeLogEntry {
  id: string
  time: number
  symbol: string
  side: 'buy' | 'sell'
  quantity: number
  price: number
  /** 模拟/实盘 */
  mode: BotMode
  /** 盈亏（平仓时才有，USDT） */
  pnl?: number
  /** 关联订单/成交说明 */
  note?: string
}

export interface PaperState {
  balanceUsdt: number
  positions: Position[]
  trades: TradeLogEntry[]
  /** 当前净值（余额 + 持仓市值） */
  equity: number
  /** 最新一次价格，用于计算持仓市值 */
  lastPrice: number
  /** 策略运行次数（用于限频或统计） */
  runCount: number
}

export interface Signal {
  action: SignalAction
  /** 建议数量（按比例换算后的 base 数量） */
  quantity?: number
  /** 可选：LLM 给出的置信度或因子值 -1~1 */
  llmScore?: number
  reason?: string
}

export const DEFAULT_BOT_CONFIG: BotConfig = {
  symbol: 'BTCUSDT',
  interval: '5m',
  strategy: 'ma_cross',
  runFrequency: 'bar',
  mode: 'paper',
  initialBalanceUsdt: 10000,
  positionSizeRatio: 0.1,
  maFast: 9,
  maSlow: 21,
  useLlmFactor: false,
}
