import { useState } from 'react'

interface SettingsProps {
  apiKey: string
  alphaVantageKey: string
  onSave: (key: string) => void
  onSaveAlphaVantage: (key: string) => void
  onClose: () => void
}

const YAHOO_PROXY_TEST_URL = '/api/yahoo-chart/v8/finance/chart/AAPL?range=1y&interval=1d'

export function Settings({ apiKey, alphaVantageKey, onSave, onSaveAlphaVantage, onClose }: SettingsProps) {
  const [key, setKey] = useState(apiKey)
  const [avKey, setAvKey] = useState(alphaVantageKey)
  const [proxyCheck, setProxyCheck] = useState<null | 'checking' | { status: number }>(null)

  const runProxyCheck = async () => {
    setProxyCheck('checking')
    try {
      const res = await fetch(YAHOO_PROXY_TEST_URL)
      setProxyCheck({ status: res.status })
    } catch (e) {
      setProxyCheck({ status: -1 })
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div
        className="bg-[var(--panel)] border border-[var(--border)] rounded-xl p-6 w-full max-w-md shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold mb-4">设置</h3>
        <p className="text-sm text-[var(--muted)] mb-2">
          美股行情使用 Finnhub，请填写 API Key（免费注册：
          <a
            href="https://finnhub.io/register"
            target="_blank"
            rel="noreferrer"
            className="text-blue-400 hover:underline ml-1"
          >
            finnhub.io
          </a>
          ）
        </p>
        <input
          type="password"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          placeholder="Finnhub API Key"
          className="w-full px-3 py-2 rounded-lg bg-[var(--bg)] border border-[var(--border)] text-[var(--text)] placeholder-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <p className="text-sm text-[var(--muted)] mt-4 mb-2">
          美股 K 线可选：Alpha Vantage Key（Yahoo 403 时可备用，免费约 25 次/天，
          <a
            href="https://www.alphavantage.co/support/#api-key"
            target="_blank"
            rel="noreferrer"
            className="text-blue-400 hover:underline ml-1"
          >
            领取
          </a>
          ）
        </p>
        <input
          type="password"
          value={avKey}
          onChange={(e) => setAvKey(e.target.value)}
          placeholder="Alpha Vantage API Key（可选）"
          className="w-full px-3 py-2 rounded-lg bg-[var(--bg)] border border-[var(--border)] text-[var(--text)] placeholder-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {import.meta.env.DEV && (
          <div className="mt-4 pt-4 border-t border-[var(--border)]">
            <p className="text-sm text-[var(--muted)] mb-2">开发环境：确认是否是代理问题</p>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={runProxyCheck}
                disabled={proxyCheck === 'checking'}
                className="px-3 py-1.5 rounded border border-[var(--border)] hover:bg-white/5 text-sm disabled:opacity-50"
              >
                {proxyCheck === 'checking' ? '请求中…' : 'Yahoo 代理请求测试'}
              </button>
              {proxyCheck && proxyCheck !== 'checking' && (
                <span className="text-sm">
                  {proxyCheck.status === 200
                    ? '→ 200：代理正常，数据应能返回'
                    : proxyCheck.status === 403
                      ? '→ 403：代理已转发，Yahoo 拒绝（非代理配置问题）'
                      : proxyCheck.status === -1
                        ? '→ 请求失败（网络或代理未生效，请确认 npm run dev 已重启）'
                        : `→ ${proxyCheck.status}：其他状态`}
                </span>
              )}
            </div>
          </div>
        )}
        <div className="flex gap-2 mt-4">
          <button
            type="button"
            onClick={() => { onSave(key); onSaveAlphaVantage(avKey); onClose(); }}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium"
          >
            保存
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-[var(--border)] hover:bg-white/5"
          >
            取消
          </button>
        </div>
      </div>
    </div>
  )
}
