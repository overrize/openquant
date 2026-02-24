/**
 * 大模型因子：将近期 K 线/行情摘要发给 LLM，解析返回的买卖建议或数值
 * 支持 OpenAI 兼容接口（如 OpenAI / 国内大模型 API）
 */

export interface LlmFactorConfig {
  apiUrl: string
  apiKey: string
  model?: string
}

export interface MarketSummary {
  symbol: string
  currentPrice: number
  change24h?: number
  changePercent24h?: number
  /** 最近 N 根 K 线简要：开高低收 */
  recentBars?: { o: number; h: number; l: number; c: number }[]
  /** 可选：RSI、恐慌贪婪等 */
  extra?: string
}

/**
 * 期望 LLM 返回格式之一：
 * - 纯数字：-1~1（负=空/减仓，正=多/加仓）
 * - 或 JSON：{ "signal": "buy"|"sell"|"hold", "score": number }
 */
export async function fetchLlmFactor(
  config: LlmFactorConfig,
  summary: MarketSummary
): Promise<{ signal: 'buy' | 'sell' | 'hold'; score: number } | null> {
  const { apiUrl, apiKey, model = 'gpt-3.5-turbo' } = config
  if (!apiUrl?.trim() || !apiKey?.trim()) return null

  const barsText = summary.recentBars?.length
    ? summary.recentBars.slice(-10).map((b, i) => `Bar${i + 1}: O=${b.o} H=${b.h} L=${b.l} C=${b.c}`).join('\n')
    : ''
  const prompt = `你是一个量化交易助手。根据以下市场数据，仅输出一个 -1 到 1 的数字表示多空倾向（负数为看空，正数为看多，0 为中性）。不要输出其他解释。

交易对: ${summary.symbol}
当前价: ${summary.currentPrice}
${summary.changePercent24h != null ? `24h涨跌幅: ${summary.changePercent24h.toFixed(2)}%` : ''}
最近K线(OHLC):
${barsText || '无'}
${summary.extra ? `其他: ${summary.extra}` : ''}

只回复一个数字，例如：0.3 或 -0.5 或 0`

  try {
    const body: Record<string, unknown> = {
      model,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 50,
      temperature: 0.1,
    }
    const res = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    })
    if (!res.ok) return null
    const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> }
    const text = data?.choices?.[0]?.message?.content?.trim() ?? ''
    const num = parseFloat(text.replace(/[^\d.-]/g, ''))
    if (Number.isNaN(num)) return null
    const score = Math.max(-1, Math.min(1, num))
    let signal: 'buy' | 'sell' | 'hold' = 'hold'
    if (score > 0.15) signal = 'buy'
    else if (score < -0.15) signal = 'sell'
    return { signal, score }
  } catch {
    return null
  }
}
