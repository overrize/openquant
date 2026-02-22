import { useState } from 'react'

interface SettingsProps {
  apiKey: string
  onSave: (key: string) => void
  onClose: () => void
}

export function Settings({ apiKey, onSave, onClose }: SettingsProps) {
  const [key, setKey] = useState(apiKey)

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
        <div className="flex gap-2 mt-4">
          <button
            type="button"
            onClick={() => { onSave(key); onClose(); }}
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
