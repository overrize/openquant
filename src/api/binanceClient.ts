/**
 * Binance REST API 客户端
 * @see https://developers.binance.com/docs/binance-spot-api-docs
 *
 * - 多主机容错：主站失败时依次尝试 api1~api4、api-gcp（Changelog 2023-05-26, 2023-06-06）
 * - 仅用于公开市场数据（如 klines），无需 API Key
 */

const BINANCE_REST_HOSTS = [
  'https://api.binance.com',
  'https://api1.binance.com',
  'https://api2.binance.com',
  'https://api3.binance.com',
  'https://api4.binance.com',
  'https://api-gcp.binance.com',
] as const

const API_PATH_PREFIX = '/api/v3'

/**
 * 请求 Binance 公开 API 路径（如 /api/v3/klines?symbol=...）
 * 失败时自动切换下一个 host 重试，最多尝试所有 host 一次
 */
export async function fetchBinanceApi(path: string): Promise<Response> {
  const pathNormalized = path.startsWith(API_PATH_PREFIX) ? path : `${API_PATH_PREFIX}${path.startsWith('/') ? path : `/${path}`}`
  let lastError: unknown
  for (const base of BINANCE_REST_HOSTS) {
    try {
      const url = `${base}${pathNormalized}`
      const res = await fetch(url)
      if (res.ok) return res
      lastError = new Error(`Binance ${base} ${res.status}`)
    } catch (e) {
      lastError = e
    }
  }
  throw lastError
}

/**
 * 请求 Binance 公开 API 并解析为 JSON
 */
export async function fetchBinanceJson<T>(path: string): Promise<T> {
  const res = await fetchBinanceApi(path)
  return res.json() as Promise<T>
}
