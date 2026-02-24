import { useState } from 'react'

interface SettingsProps {
  apiKey: string
  alphaVantageKey: string
  llmApiUrl: string
  llmApiKey: string
  onSave: (key: string) => void
  onSaveAlphaVantage: (key: string) => void
  onSaveLlm?: (url: string, key: string) => void
  onClose: () => void
}

const YAHOO_PROXY_TEST_URL = '/api/yahoo-chart/v8/finance/chart/AAPL?range=1y&interval=1d'

export function Settings({
  apiKey,
  alphaVantageKey,
  llmApiUrl,
  llmApiKey,
  onSave,
  onSaveAlphaVantage,
  onSaveLlm,
  onClose,
}: SettingsProps) {
  const [key, setKey] = useState(apiKey)
  const [avKey, setAvKey] = useState(alphaVantageKey)
  const [llmUrl, setLlmUrl] = useState(llmApiUrl)
  const [llmKey, setLlmKey] = useState(llmApiKey)
  const [proxyCheck, setProxyCheck] = useState<null | 'checking' | { status: number }>(null)

  const runProxyCheck = async () => {
    setProxyCheck('checking')
    try {
      const res = await fetch(YAHOO_PROXY_TEST_URL)
      setProxyCheck({ status: res.status })
    } catch {
      setProxyCheck({ status: -1 })
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div
        className="glass-card rounded-2xl p-6 w-full max-w-lg shadow-card-lg animate-slideUp mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500/30 to-violet-500/30 border border-blue-500/20 flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-[var(--text)]">设置</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[var(--muted)] hover:text-[var(--text)] p-1.5 rounded-lg hover:bg-white/5 transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="space-y-5">
          {/* Finnhub */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-[var(--text)]">Finnhub API Key</label>
            <p className="text-xs text-[var(--muted)]">
              美股行情数据源（免费注册：
              <a href="https://finnhub.io/register" target="_blank" rel="noreferrer" className="text-blue-400 hover:underline">finnhub.io</a>）
            </p>
            <input
              type="password"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="Finnhub API Key"
              className="w-full input-field text-sm"
            />
          </div>

          {/* Alpha Vantage */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-[var(--text)]">Alpha Vantage Key <span className="text-xs text-[var(--muted)] font-normal">可选</span></label>
            <p className="text-xs text-[var(--muted)]">
              美股 K 线备用源（约 25 次/天，
              <a href="https://www.alphavantage.co/support/#api-key" target="_blank" rel="noreferrer" className="text-blue-400 hover:underline">领取</a>）
            </p>
            <input
              type="password"
              value={avKey}
              onChange={(e) => setAvKey(e.target.value)}
              placeholder="Alpha Vantage API Key"
              className="w-full input-field text-sm"
            />
          </div>

          {/* LLM */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-[var(--text)]">LLM 因子配置 <span className="text-xs text-[var(--muted)] font-normal">可选</span></label>
            <p className="text-xs text-[var(--muted)]">
              OpenAI 兼容接口，用于 Bot 大模型因子策略
            </p>
            <input
              type="text"
              value={llmUrl}
              onChange={(e) => setLlmUrl(e.target.value)}
              placeholder="https://api.openai.com/v1/chat/completions"
              className="w-full input-field text-sm"
            />
            <input
              type="password"
              value={llmKey}
              onChange={(e) => setLlmKey(e.target.value)}
              placeholder="LLM API Key"
              className="w-full input-field text-sm"
            />
          </div>

          {import.meta.env.DEV && (
            <div className="pt-4 border-t border-[var(--border)]">
              <p className="text-xs text-[var(--muted)] mb-2">开发环境诊断</p>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={runProxyCheck}
                  disabled={proxyCheck === 'checking'}
                  className="btn-ghost text-xs disabled:opacity-50"
                >
                  {proxyCheck === 'checking' ? '请求中…' : 'Yahoo 代理测试'}
                </button>
                {proxyCheck && proxyCheck !== 'checking' && (
                  <span className="text-xs">
                    {proxyCheck.status === 200
                      ? '→ 200：代理正常'
                      : proxyCheck.status === 403
                        ? '→ 403：Yahoo 拒绝'
                        : proxyCheck.status === -1
                          ? '→ 请求失败'
                          : `→ ${proxyCheck.status}`}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3 mt-6 pt-4 border-t border-[var(--border)]">
          <button
            type="button"
            onClick={() => {
              onSave(key)
              onSaveAlphaVantage(avKey)
              onSaveLlm?.(llmUrl, llmKey)
              onClose()
            }}
            className="btn-primary flex-1"
          >
            保存
          </button>
          <button
            type="button"
            onClick={onClose}
            className="btn-ghost flex-1"
          >
            取消
          </button>
        </div>
      </div>
    </div>
  )
}
