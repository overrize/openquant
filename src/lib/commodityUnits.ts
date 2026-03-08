/**
 * 贵金属·原油 常规单位折算
 * 当前数据来源：美股 ETF 价格（Finnhub），按公开的持仓比例折算为 美元/克、美元/桶
 * 1 金衡盎司(troy oz) = 31.1034768 克
 */

const TROY_OZ_TO_G = 31.1034768

/** 每份 ETF 对应的贵金属盎司数（或原油桶数） */
export const COMMODITY_RATIO: Record<string, { perShare: number; unit: 'USD/克' | 'USD/桶'; unitEn: string }> = {
  GLD: { perShare: 0.1, unit: 'USD/克', unitEn: 'per gram' },           // 1 share ≈ 0.1 troy oz gold
  IAU: { perShare: 0.1, unit: 'USD/克', unitEn: 'per gram' },
  SLV: { perShare: 1, unit: 'USD/克', unitEn: 'per gram' },           // 1 share ≈ 1 troy oz silver
  PPLT: { perShare: 0.1, unit: 'USD/克', unitEn: 'per gram' },        // 铂金
  USO: { perShare: 1, unit: 'USD/桶', unitEn: 'per barrel' },        // 约 1 桶 WTI
  BNO: { perShare: 1, unit: 'USD/桶', unitEn: 'per barrel' },        // 约 1 桶 Brent
}

/**
 * 将 ETF 价格折算为常规单位
 * - 黄金/白银/铂金：美元/克 (USD/g)
 * - 原油：美元/桶 (USD/barrel)
 */
export function toConventionalUnit(priceUsdPerShare: number, symbol: string): { value: number; unit: string } | null {
  const ratio = COMMODITY_RATIO[symbol]
  if (!ratio || priceUsdPerShare <= 0) return null
  if (ratio.unit === 'USD/克') {
    const ozPerShare = ratio.perShare
    const usdPerOz = priceUsdPerShare / ozPerShare
    const usdPerGram = usdPerOz / TROY_OZ_TO_G
    return { value: usdPerGram, unit: '美元/克' }
  }
  if (ratio.unit === 'USD/桶') {
    return { value: priceUsdPerShare / ratio.perShare, unit: '美元/桶' }
  }
  return null
}

export function getCommodityUnitLabel(symbol: string): string | null {
  return COMMODITY_RATIO[symbol]?.unit ?? null
}
