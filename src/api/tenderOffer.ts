/**
 * 要约收购套利：从 SEC EDGAR 获取近期 Tender Offer 申报，并可与股价合并计算价差
 * 参考：https://github.com/d-wwei/tender-offer-arbitrage
 */

const SEC_USER_AGENT = 'OpenQuant/1.0 (contact@example.com)'

export interface TenderOfferFiling {
  cik: string
  companyName: string
  filingType: string
  filingDate: string
  filingUrl: string
  ticker?: string
}

export interface TenderOfferItem extends TenderOfferFiling {
  ticker: string
  currentPrice?: number
  offerPrice?: number
  spreadPct?: number
  oddLotPriority?: boolean
  deadline?: string
  note?: string
}

/** SEC company_tickers.json 单条 */
interface SecCompanyTicker {
  cik_str: number
  ticker: string
  title: string
}

/** 从 SEC 获取 CIK -> ticker 映射 */
export async function fetchSecCompanyTickers(): Promise<Record<string, string>> {
  const res = await fetch('https://www.sec.gov/files/company_tickers.json', {
    headers: { 'User-Agent': SEC_USER_AGENT },
  })
  if (!res.ok) throw new Error('SEC company list 请求失败')
  const data = (await res.json()) as Record<string, SecCompanyTicker>
  const map: Record<string, string> = {}
  for (const [, v] of Object.entries(data)) {
    const cik = String(v.cik_str).padStart(10, '0')
    map[cik] = v.ticker
  }
  return map
}

/** 解析 SEC EDGAR ATOM feed，获取近期 SC TO 申报列表 */
export async function fetchRecentTenderOfferFilings(): Promise<TenderOfferFiling[]> {
  const url = 'https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&company=&type=SC+TO&owner=include&count=40&output=atom'
  const res = await fetch(url, { headers: { 'User-Agent': SEC_USER_AGENT } })
  if (!res.ok) throw new Error('SEC EDGAR 请求失败')
  const xml = await res.text()
  const parser = new DOMParser()
  const doc = parser.parseFromString(xml, 'application/xml')
  const entries = doc.querySelectorAll('entry')
  const list: TenderOfferFiling[] = []
  const cikRe = /CIK=(\d+)/i
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i]!
    const titleEl = entry.querySelector('title')
    const linkEl = entry.querySelector('link[rel="alternate"]')
    const idEl = entry.querySelector('id')
    const updatedEl = entry.querySelector('updated')
    const title = titleEl?.textContent?.trim() ?? ''
    const link = linkEl?.getAttribute('href') ?? idEl?.textContent ?? ''
    const match = link.match(cikRe)
    const cik = match ? match[1]!.padStart(10, '0') : ''
    const updated = updatedEl?.textContent?.trim() ?? ''
    const filingDate = updated.slice(0, 10)
    const filingType = title.includes('SC TO-T') ? 'SC TO-T' : title.includes('SC TO-I') ? 'SC TO-I' : 'SC TO'
    list.push({
      cik,
      companyName: title.replace(/\s*-\s*EDGAR.*$/i, '').trim(),
      filingType,
      filingDate,
      filingUrl: link,
    })
  }
  return list
}

/** 合并申报列表与 SEC ticker 映射，并可选填入当前价、要约价等 */
export function mergeTickers(
  filings: TenderOfferFiling[],
  cikToTicker: Record<string, string>
): TenderOfferItem[] {
  return filings
    .map((f) => {
      const ticker = f.ticker ?? cikToTicker[f.cik] ?? ''
      if (!ticker) return null
      return { ...f, ticker } as TenderOfferItem
    })
    .filter((x): x is TenderOfferItem => Boolean(x))
}

/** Finnhub 单只股票当前价 */
export async function fetchFinnhubQuote(symbol: string, apiKey: string): Promise<number | null> {
  const res = await fetch(
    `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(symbol)}&token=${apiKey}`
  )
  if (!res.ok) return null
  const data = (await res.json()) as { c?: number }
  const price = data.c
  return typeof price === 'number' && price > 0 ? price : null
}

/** 计算价差百分比 */
export function spreadPct(offerPrice: number, currentPrice: number): number {
  if (currentPrice <= 0) return 0
  return ((offerPrice - currentPrice) / currentPrice) * 100
}
