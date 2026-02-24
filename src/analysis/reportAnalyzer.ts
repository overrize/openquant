/**
 * 研报因子分析引擎
 * 从研报文本中提取关键因子并计算综合评分
 */

export interface ReportFactor {
  name: string
  value: number | string
  score: number      // -1 ~ 1, 负面到正面
  category: FactorCategory
  description: string
}

export type FactorCategory = 'valuation' | 'growth' | 'sentiment' | 'risk' | 'technical'

export interface ReportAnalysis {
  title: string
  ticker?: string
  rating: 'strong_buy' | 'buy' | 'hold' | 'sell' | 'strong_sell'
  targetPrice?: number
  currentPrice?: number
  overallScore: number // 0 ~ 100
  factors: ReportFactor[]
  summary: string
  keywords: string[]
  riskLevel: 'low' | 'medium' | 'high'
  timestamp: number
}

const POSITIVE_WORDS = [
  '增长', '上涨', '突破', '超预期', '利好', '强劲', '领先', '优势',
  '创新', '提升', '扩张', '盈利', '龙头', '推荐', '买入', '看好',
  '上调', '加速', '景气', '回暖', '复苏', '向好', '改善', '强烈推荐',
  '高增长', '确定性', '稀缺性', '核心竞争力', '护城河', '催化剂',
  'growth', 'outperform', 'buy', 'strong', 'bullish', 'upgrade',
  'beat', 'exceed', 'momentum', 'upside', 'overweight', 'attractive',
]

const NEGATIVE_WORDS = [
  '下跌', '风险', '下滑', '低于预期', '利空', '疲软', '下调', '减持',
  '卖出', '衰退', '萎缩', '亏损', '压力', '不确定', '减少', '困难',
  '恶化', '下行', '收缩', '回落', '承压', '瓶颈', '警惕', '谨慎',
  'decline', 'underperform', 'sell', 'weak', 'bearish', 'downgrade',
  'miss', 'risk', 'underweight', 'headwind', 'downside',
]

const RATING_PATTERNS: [RegExp, ReportAnalysis['rating']][] = [
  [/强烈推荐|strong\s*buy/i, 'strong_buy'],
  [/买入|推荐|增持|outperform|buy|overweight/i, 'buy'],
  [/持有|中性|hold|neutral|equal.?weight/i, 'hold'],
  [/减持|underperform|underweight/i, 'sell'],
  [/卖出|sell|strong\s*sell/i, 'strong_sell'],
]

function extractTicker(text: string): string | undefined {
  const usMatch = text.match(/\b([A-Z]{1,5})\b(?=.*(?:stock|share|equity|nasdaq|nyse|美股))/i)
  if (usMatch) return usMatch[1].toUpperCase()

  const cnMatch = text.match(/\b(\d{6})\b(?=.*(?:\.SH|\.SZ|沪|深|A股|股票))/i)
  if (cnMatch) return cnMatch[1]

  const symbolMatch = text.match(/(?:股票代码|代码|ticker|symbol)[：:\s]*([A-Z]{1,5}|\d{6})/i)
  if (symbolMatch) return symbolMatch[1].toUpperCase()

  return undefined
}

function extractTargetPrice(text: string): number | undefined {
  const patterns = [
    /目标价[：:\s]*(?:人民币|¥|￥|RMB|USD|\$)?\s*(\d+(?:\.\d+)?)/i,
    /target\s*price[：:\s]*\$?\s*(\d+(?:\.\d+)?)/i,
    /(\d+(?:\.\d+)?)\s*(?:元|美元).*目标/,
  ]
  for (const p of patterns) {
    const m = text.match(p)
    if (m) return parseFloat(m[1])
  }
  return undefined
}

function extractPE(text: string): number | undefined {
  const patterns = [
    /(?:PE|P\/E|市盈率)[：:\s约]*(\d+(?:\.\d+)?)\s*(?:倍|x|X)?/i,
    /(\d+(?:\.\d+)?)\s*(?:倍|x|X)\s*(?:PE|P\/E|市盈率)/i,
  ]
  for (const p of patterns) {
    const m = text.match(p)
    if (m) return parseFloat(m[1])
  }
  return undefined
}

function extractPB(text: string): number | undefined {
  const m = text.match(/(?:PB|P\/B|市净率)[：:\s约]*(\d+(?:\.\d+)?)/i)
  return m ? parseFloat(m[1]) : undefined
}

function extractROE(text: string): number | undefined {
  const m = text.match(/ROE[：:\s约]*(\d+(?:\.\d+)?)%?/i)
  return m ? parseFloat(m[1]) : undefined
}

function extractRevenueGrowth(text: string): number | undefined {
  const patterns = [
    /营收.*?(?:同比|yoy).*?(?:增长|增加|增)\s*(\d+(?:\.\d+)?)%/i,
    /revenue.*?(?:growth|grew|increase).*?(\d+(?:\.\d+)?)%/i,
    /(?:同比|yoy).*?营收.*?(\d+(?:\.\d+)?)%/i,
  ]
  for (const p of patterns) {
    const m = text.match(p)
    if (m) return parseFloat(m[1])
  }
  return undefined
}

function extractProfitGrowth(text: string): number | undefined {
  const patterns = [
    /(?:净利润|归母净利|利润).*?(?:同比|yoy).*?(?:增长|增加|增)\s*(\d+(?:\.\d+)?)%/i,
    /(?:earnings|profit|net income).*?(?:growth|grew|increase).*?(\d+(?:\.\d+)?)%/i,
  ]
  for (const p of patterns) {
    const m = text.match(p)
    if (m) return parseFloat(m[1])
  }
  return undefined
}

function sentimentScore(text: string): number {
  const lower = text.toLowerCase()
  let pos = 0, neg = 0
  POSITIVE_WORDS.forEach(w => {
    const re = new RegExp(w, 'gi')
    const matches = lower.match(re)
    if (matches) pos += matches.length
  })
  NEGATIVE_WORDS.forEach(w => {
    const re = new RegExp(w, 'gi')
    const matches = lower.match(re)
    if (matches) neg += matches.length
  })
  const total = pos + neg
  if (total === 0) return 0
  return (pos - neg) / total
}

function extractRating(text: string): ReportAnalysis['rating'] {
  for (const [pattern, rating] of RATING_PATTERNS) {
    if (pattern.test(text)) return rating
  }
  const score = sentimentScore(text)
  if (score > 0.4) return 'buy'
  if (score > 0.15) return 'hold'
  if (score < -0.3) return 'sell'
  return 'hold'
}

function extractKeywords(text: string): string[] {
  const keywords: string[] = []
  const patterns = [
    /(?:关键词|核心观点|投资逻辑|要点)[：:\s]*([\s\S]{5,100})/gi,
  ]
  for (const p of patterns) {
    const m = p.exec(text)
    if (m) {
      const parts = m[1].split(/[，,、；;]/).map(s => s.trim()).filter(s => s.length > 1 && s.length < 20)
      keywords.push(...parts)
    }
  }

  const buzzwords = [
    'AI', '人工智能', '芯片', '半导体', '新能源', '光伏', '储能', '电动车',
    '医药', '消费', '白酒', '数字经济', '大模型', 'SaaS', '云计算',
    '国产替代', '碳中和', '元宇宙', '机器人', '自动驾驶',
  ]
  buzzwords.forEach(w => {
    if (text.includes(w) && !keywords.includes(w)) keywords.push(w)
  })

  return keywords.slice(0, 8)
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v))
}

export function analyzeReport(text: string): ReportAnalysis {
  const trimmed = text.trim()
  const title = trimmed.split(/[\n\r]/)[0]?.slice(0, 80) || '未命名研报'

  const ticker = extractTicker(trimmed)
  const targetPrice = extractTargetPrice(trimmed)
  const pe = extractPE(trimmed)
  const pb = extractPB(trimmed)
  const roe = extractROE(trimmed)
  const revenueGrowth = extractRevenueGrowth(trimmed)
  const profitGrowth = extractProfitGrowth(trimmed)
  const sentiment = sentimentScore(trimmed)
  const rating = extractRating(trimmed)
  const keywords = extractKeywords(trimmed)

  const factors: ReportFactor[] = []

  if (pe != null) {
    const peScore = pe < 15 ? 0.8 : pe < 25 ? 0.4 : pe < 40 ? 0 : pe < 60 ? -0.3 : -0.6
    factors.push({
      name: 'PE (市盈率)',
      value: pe.toFixed(1),
      score: peScore,
      category: 'valuation',
      description: pe < 15 ? '估值偏低，有安全边际' : pe < 25 ? '估值合理' : pe < 40 ? '估值中等偏高' : '估值偏高，注意风险',
    })
  }

  if (pb != null) {
    const pbScore = pb < 1 ? 0.7 : pb < 2 ? 0.3 : pb < 5 ? 0 : -0.4
    factors.push({
      name: 'PB (市净率)',
      value: pb.toFixed(2),
      score: pbScore,
      category: 'valuation',
      description: pb < 1 ? '破净，估值极低' : pb < 2 ? '估值合理' : pb < 5 ? '估值中等' : '估值偏高',
    })
  }

  if (roe != null) {
    const roeScore = roe > 20 ? 0.9 : roe > 15 ? 0.6 : roe > 10 ? 0.3 : roe > 5 ? 0 : -0.3
    factors.push({
      name: 'ROE (净资产收益率)',
      value: `${roe.toFixed(1)}%`,
      score: roeScore,
      category: 'growth',
      description: roe > 20 ? '盈利能力优秀' : roe > 15 ? '盈利能力较好' : roe > 10 ? '盈利能力一般' : '盈利能力偏弱',
    })
  }

  if (revenueGrowth != null) {
    const revScore = revenueGrowth > 50 ? 0.9 : revenueGrowth > 30 ? 0.7 : revenueGrowth > 15 ? 0.4 : revenueGrowth > 0 ? 0.1 : -0.5
    factors.push({
      name: '营收增速',
      value: `${revenueGrowth.toFixed(1)}%`,
      score: revScore,
      category: 'growth',
      description: revenueGrowth > 30 ? '高速增长' : revenueGrowth > 15 ? '稳健增长' : revenueGrowth > 0 ? '低速增长' : '负增长',
    })
  }

  if (profitGrowth != null) {
    const profScore = profitGrowth > 50 ? 0.9 : profitGrowth > 30 ? 0.7 : profitGrowth > 15 ? 0.4 : profitGrowth > 0 ? 0.1 : -0.5
    factors.push({
      name: '利润增速',
      value: `${profitGrowth.toFixed(1)}%`,
      score: profScore,
      category: 'growth',
      description: profitGrowth > 30 ? '利润高增长' : profitGrowth > 15 ? '利润稳健增长' : profitGrowth > 0 ? '利润低增长' : '利润下滑',
    })
  }

  factors.push({
    name: '情绪得分',
    value: `${(sentiment * 100).toFixed(0)}`,
    score: sentiment,
    category: 'sentiment',
    description: sentiment > 0.3 ? '研报整体积极乐观' : sentiment > 0 ? '研报偏向中性偏多' : sentiment > -0.3 ? '研报偏向谨慎' : '研报整体偏空',
  })

  if (targetPrice != null) {
    factors.push({
      name: '目标价',
      value: targetPrice.toFixed(2),
      score: 0.5,
      category: 'valuation',
      description: `分析师给出目标价 ${targetPrice.toFixed(2)}`,
    })
  }

  const negCount = NEGATIVE_WORDS.filter(w => trimmed.includes(w)).length
  const riskRatio = negCount / (NEGATIVE_WORDS.length * 0.15)
  const riskLevel: ReportAnalysis['riskLevel'] = riskRatio > 0.6 ? 'high' : riskRatio > 0.3 ? 'medium' : 'low'
  const riskScore = riskLevel === 'low' ? 0.5 : riskLevel === 'medium' ? 0 : -0.5
  factors.push({
    name: '风险评估',
    value: riskLevel === 'low' ? '低' : riskLevel === 'medium' ? '中' : '高',
    score: riskScore,
    category: 'risk',
    description: riskLevel === 'low' ? '风险因素较少' : riskLevel === 'medium' ? '存在一定风险因素' : '风险因素较多，需警惕',
  })

  const validFactors = factors.filter(f => f.score !== 0 || f.category === 'sentiment')
  const avgScore = validFactors.length > 0
    ? validFactors.reduce((s, f) => s + f.score, 0) / validFactors.length
    : 0
  const overallScore = clamp(Math.round((avgScore + 1) / 2 * 100), 0, 100)

  const lines = trimmed.split(/[\n\r]+/).filter(l => l.trim().length > 10)
  const summary = lines.slice(0, 3).join(' ').slice(0, 200) + (lines.length > 3 ? '…' : '')

  return {
    title,
    ticker,
    rating,
    targetPrice,
    overallScore,
    factors,
    summary,
    keywords,
    riskLevel,
    timestamp: Date.now(),
  }
}

export function getRatingLabel(rating: ReportAnalysis['rating']): string {
  const map: Record<ReportAnalysis['rating'], string> = {
    strong_buy: '强烈推荐',
    buy: '买入',
    hold: '持有',
    sell: '减持',
    strong_sell: '卖出',
  }
  return map[rating]
}

export function getRatingColor(rating: ReportAnalysis['rating']): string {
  const map: Record<ReportAnalysis['rating'], string> = {
    strong_buy: 'text-emerald-400',
    buy: 'text-green-400',
    hold: 'text-amber-400',
    sell: 'text-orange-400',
    strong_sell: 'text-red-400',
  }
  return map[rating]
}

export function getCategoryLabel(cat: FactorCategory): string {
  const map: Record<FactorCategory, string> = {
    valuation: '估值',
    growth: '成长',
    sentiment: '情绪',
    risk: '风险',
    technical: '技术',
  }
  return map[cat]
}

export function getCategoryColor(cat: FactorCategory): string {
  const map: Record<FactorCategory, string> = {
    valuation: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    growth: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    sentiment: 'bg-violet-500/20 text-violet-300 border-violet-500/30',
    risk: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
    technical: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
  }
  return map[cat]
}
