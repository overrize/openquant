export type AssetType = 'stock' | 'crypto' | 'cnstock'

export interface TickerRow {
  id: string
  type: AssetType
  symbol: string       // 显示用，如 AAPL, 600519
  name?: string        // 名称（A 股用）
  price: number
  prevClose?: number   // 前收/用于算涨跌幅
  change?: number
  changePercent?: number
  volume?: number
  lastUpdate: number
  flash?: 'up' | 'down'  // 用于闪烁效果
}

/** 东方财富 A 股：secid 格式为 市场.代码，如 1.600519 沪市 0.000001 深市 */
export interface CnStockSymbol {
  secid: string   // '1.600519' | '0.000001'
  code: string    // '600519' | '000001'
  name?: string
}

export const STOCK_SYMBOLS = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'META', 'TSLA', 'AMD', 'JPM', 'V', 'JNJ', 'WMT', 'UNH', 'HD']
/** 美股代码 -> 英文公司名（用于显示） */
export const STOCK_NAMES: Record<string, string> = {
  AAPL: 'Apple',
  MSFT: 'Microsoft',
  GOOGL: 'Alphabet (Google)',
  AMZN: 'Amazon',
  NVDA: 'NVIDIA',
  META: 'Meta',
  TSLA: 'Tesla',
  AMD: 'AMD',
  JPM: 'JPMorgan Chase',
  V: 'Visa',
  JNJ: 'Johnson & Johnson',
  WMT: 'Walmart',
  UNH: 'UnitedHealth',
  HD: 'Home Depot',
}
export const CRYPTO_SYMBOLS = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT', 'XRPUSDT', 'DOGEUSDT', 'ADAUSDT', 'AVAXUSDT']

/** 默认 A 股（沪市 1.xxx 深市 0.xxx）*/
export const CN_STOCK_SYMBOLS: CnStockSymbol[] = [
  { secid: '1.600519', code: '600519', name: '贵州茅台' },
  { secid: '1.601318', code: '601318', name: '中国平安' },
  { secid: '1.600036', code: '600036', name: '招商银行' },
  { secid: '0.000858', code: '000858', name: '五粮液' },
  { secid: '0.002594', code: '002594', name: '比亚迪' },
  { secid: '0.300750', code: '300750', name: '宁德时代' },
]
