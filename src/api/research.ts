/**
 * 东方财富研报/调研数据源（第一版）
 * 当前接入 RPT_ORG_SURVEY（机构调研），包含较完整正文，可直接用于因子分析。
 */

export interface EastmoneyResearchItem {
  id: string
  code: string
  name: string
  noticeDate: string
  receiveObject?: string
  content: string
}

const EASTMONEY_DC = 'https://datacenter-web.eastmoney.com/api/data/v1/get'

async function fetchEastmoneyJson(url: string): Promise<unknown> {
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`东财请求失败: ${res.status}`)
  }

  const contentType = (res.headers.get('content-type') || '').toLowerCase()
  if (contentType.includes('charset=gbk') || contentType.includes('charset=gb2312')) {
    const buf = await res.arrayBuffer()
    const gbkText = new TextDecoder('gbk').decode(buf)
    return JSON.parse(gbkText)
  }

  // 默认按 UTF-8 读取，避免把 UTF-8 文本误按 GBK 解码导致乱码
  const utf8Text = await res.text()
  try {
    return JSON.parse(utf8Text)
  } catch {
    // 兜底：若服务端未声明 charset 且实际是 GBK，再尝试 GBK
    const buf = await fetch(url).then((r) => r.arrayBuffer())
    const gbkText = new TextDecoder('gbk').decode(buf)
    return JSON.parse(gbkText)
  }
}

function normalizeText(s: unknown): string {
  return String(s ?? '').replace(/\r\n/g, '\n').trim()
}

/**
 * 拉取东方财富机构调研列表（按股票代码）
 */
export async function fetchEastmoneyResearchByCode(code: string, pageSize = 10): Promise<EastmoneyResearchItem[]> {
  const normalizedCode = String(code).trim().replace(/\D/g, '')
  if (!normalizedCode) return []

  const params = new URLSearchParams({
    reportName: 'RPT_ORG_SURVEY',
    pageNumber: '1',
    pageSize: String(pageSize),
    sortColumns: 'NOTICE_DATE',
    sortTypes: '-1',
    columns: 'SECURITY_CODE,SECURITY_NAME_ABBR,NOTICE_DATE,RECEIVE_OBJECT,CONTENT',
    filter: `(SECURITY_CODE="${normalizedCode}")`,
  })

  const json = await fetchEastmoneyJson(`${EASTMONEY_DC}?${params.toString()}`) as {
    result?: { data?: Array<Record<string, unknown>> }
  }

  const list = json?.result?.data ?? []
  const out: EastmoneyResearchItem[] = []
  list.forEach((row, idx) => {
    const content = normalizeText(row.CONTENT)
    if (!content) return
    const code = normalizeText(row.SECURITY_CODE)
    const date = normalizeText(row.NOTICE_DATE).slice(0, 10)
    const receiveObject = normalizeText(row.RECEIVE_OBJECT)
    out.push({
      id: `${code}-${date}-${idx}`,
      code,
      name: normalizeText(row.SECURITY_NAME_ABBR),
      noticeDate: date,
      receiveObject: receiveObject || undefined,
      content,
    })
  })
  return out
}

