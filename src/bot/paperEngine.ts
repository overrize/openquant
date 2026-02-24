/**
 * 虚拟盘引擎：维护虚拟余额与持仓，按市价模拟成交
 */

import type { BotConfig, PaperState, Position, TradeLogEntry } from './types'

let tradeIdCounter = 0
function nextTradeId(): string {
  return `paper-${Date.now()}-${++tradeIdCounter}`
}

export function createInitialPaperState(config: BotConfig): PaperState {
  return {
    balanceUsdt: config.initialBalanceUsdt,
    positions: [],
    trades: [],
    equity: config.initialBalanceUsdt,
    lastPrice: 0,
    runCount: 0,
  }
}

export function updatePaperEquity(state: PaperState, lastPrice: number): PaperState {
  let equity = state.balanceUsdt
  for (const pos of state.positions) {
    const markValue = pos.quantity * lastPrice
    if (pos.side === 'long') equity += markValue
    else equity -= markValue
  }
  return { ...state, lastPrice, equity }
}

/**
 * 按市价模拟买入：扣 USDT，增加多仓
 */
export function paperBuy(
  state: PaperState,
  symbol: string,
  quantity: number,
  price: number,
  config: BotConfig
): PaperState {
  const cost = quantity * price
  if (cost > state.balanceUsdt) return state

  const newBalance = state.balanceUsdt - cost
  const existing = state.positions.find((p) => p.symbol === symbol && p.side === 'long')
  let positions: Position[] = state.positions.filter((p) => !(p.symbol === symbol && p.side === 'long'))
  if (existing) {
    const totalQty = existing.quantity + quantity
    const avgPrice = (existing.avgPrice * existing.quantity + price * quantity) / totalQty
    positions = [...positions, { symbol, side: 'long', quantity: totalQty, avgPrice, openTime: existing.openTime }]
  } else {
    positions = [...positions, { symbol, side: 'long', quantity, avgPrice: price, openTime: Date.now() }]
  }

  const log: TradeLogEntry = {
    id: nextTradeId(),
    time: Date.now(),
    symbol,
    side: 'buy',
    quantity,
    price,
    mode: config.mode,
    note: '虚拟盘买入',
  }
  const trades = [...state.trades, log].slice(-500)
  const next = { ...state, balanceUsdt: newBalance, positions, trades }
  return updatePaperEquity(next, price)
}

/**
 * 按市价模拟卖出：平多仓或开空仓（此处仅做平多/减多）
 */
export function paperSell(
  state: PaperState,
  symbol: string,
  quantity: number,
  price: number,
  config: BotConfig
): PaperState {
  const longPos = state.positions.find((p) => p.symbol === symbol && p.side === 'long')
  const toClose = longPos ? Math.min(quantity, longPos.quantity) : 0
  if (toClose <= 0) return state

  const revenue = toClose * price
  const costBasis = longPos!.avgPrice * toClose
  const pnl = revenue - costBasis

  let positions = state.positions.map((p) => {
    if (p.symbol === symbol && p.side === 'long') {
      const remaining = p.quantity - toClose
      if (remaining <= 0) return null
      return { ...p, quantity: remaining }
    }
    return p
  }).filter(Boolean) as Position[]

  const newBalance = state.balanceUsdt + revenue
  const log: TradeLogEntry = {
    id: nextTradeId(),
    time: Date.now(),
    symbol,
    side: 'sell',
    quantity: toClose,
    price,
    mode: config.mode,
    pnl,
    note: '虚拟盘卖出',
  }
  const trades = [...state.trades, log].slice(-500)
  const next = { ...state, balanceUsdt: newBalance, positions, trades }
  return updatePaperEquity(next, price)
}

/**
 * 根据信号执行一笔：只做单向持仓（多），不做法币空
 */
export function paperExecute(
  state: PaperState,
  symbol: string,
  side: 'buy' | 'sell',
  quantity: number,
  price: number,
  config: BotConfig
): PaperState {
  if (quantity <= 0 || price <= 0) return state
  if (side === 'buy') return paperBuy(state, symbol, quantity, price, config)
  return paperSell(state, symbol, quantity, price, config)
}
