import { useState, useCallback } from 'react'
import {
  analyzeReport,
  getRatingLabel,
  getRatingColor,
  getCategoryLabel,
  getCategoryColor,
  type ReportAnalysis,
  type ReportFactor,
} from '../analysis/reportAnalyzer'

const LS_REPORTS_KEY = 'research_reports'

function loadReports(): ReportAnalysis[] {
  try {
    const s = localStorage.getItem(LS_REPORTS_KEY)
    if (s) return JSON.parse(s) as ReportAnalysis[]
  } catch {}
  return []
}

function saveReports(reports: ReportAnalysis[]) {
  localStorage.setItem(LS_REPORTS_KEY, JSON.stringify(reports.slice(0, 20)))
}

const SAMPLE_REPORT = `中信证券 - 宁德时代（300750.SZ）深度研究报告

评级：买入  目标价：280.00元

核心观点：
宁德时代作为全球动力电池龙头企业，2024年营收同比增长35.2%，归母净利润同比增长42.5%。公司在技术创新、产能扩张和全球化布局方面持续领先。

关键数据：
- PE(TTM): 22.5倍
- PB: 4.8倍
- ROE: 18.5%
- 营收增速: 同比增长35.2%
- 净利润增速: 同比增长42.5%

投资逻辑：
1. 全球新能源车渗透率持续提升，动力电池需求强劲增长
2. 麒麟电池、神行超充电池等新产品技术领先，核心竞争力突出
3. 储能业务高速增长，打开第二增长曲线
4. 海外产能布局加速，全球市占率有望进一步提升

风险提示：
- 原材料价格波动风险
- 行业竞争加剧
- 海外政策不确定性

关键词：新能源、动力电池、储能、全球化、龙头`

function ScoreRing({ score, size = 80 }: { score: number; size?: number }) {
  const radius = (size - 8) / 2
  const circumference = 2 * Math.PI * radius
  const progress = (score / 100) * circumference
  const color = score >= 70 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444'

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--border)"
          strokeWidth="4"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xl font-bold font-mono" style={{ color }}>{score}</span>
      </div>
    </div>
  )
}

function FactorBar({ factor }: { factor: ReportFactor }) {
  const width = Math.abs(factor.score) * 100
  const isPositive = factor.score >= 0

  return (
    <div className="glass-card rounded-lg p-3 space-y-2 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`text-xs px-2 py-0.5 rounded-full border ${getCategoryColor(factor.category)}`}>
            {getCategoryLabel(factor.category)}
          </span>
          <span className="text-sm font-medium text-[var(--text)]">{factor.name}</span>
        </div>
        <span className="text-sm font-mono font-semibold text-[var(--text)]">{factor.value}</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 rounded-full bg-[var(--bg)] overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isPositive ? 'bg-emerald-500' : 'bg-red-500'
            }`}
            style={{ width: `${Math.max(width, 5)}%` }}
          />
        </div>
        <span className={`text-xs font-mono w-10 text-right ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
          {factor.score > 0 ? '+' : ''}{factor.score.toFixed(2)}
        </span>
      </div>
      <p className="text-xs text-[var(--muted)]">{factor.description}</p>
    </div>
  )
}

function ReportCard({
  report,
  isExpanded,
  onToggle,
  onDelete,
}: {
  report: ReportAnalysis
  isExpanded: boolean
  onToggle: () => void
  onDelete: () => void
}) {
  const factorsByCategory = report.factors.reduce((acc, f) => {
    if (!acc[f.category]) acc[f.category] = []
    acc[f.category].push(f)
    return acc
  }, {} as Record<string, ReportFactor[]>)

  return (
    <div className="glass-card glass-card-hover rounded-xl overflow-hidden transition-all duration-300 animate-fadeIn">
      <div
        className="p-4 cursor-pointer flex items-start gap-4"
        onClick={onToggle}
        role="button"
      >
        <ScoreRing score={report.overallScore} size={64} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {report.ticker && (
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                {report.ticker}
              </span>
            )}
            <span className={`text-xs font-semibold px-2 py-0.5 rounded ${getRatingColor(report.rating)} bg-current/10`}>
              {getRatingLabel(report.rating)}
            </span>
            <span className={`text-xs px-2 py-0.5 rounded ${
              report.riskLevel === 'low' ? 'bg-green-500/20 text-green-300' :
              report.riskLevel === 'medium' ? 'bg-amber-500/20 text-amber-300' :
              'bg-red-500/20 text-red-300'
            }`}>
              {report.riskLevel === 'low' ? '低风险' : report.riskLevel === 'medium' ? '中风险' : '高风险'}
            </span>
          </div>
          <h3 className="text-sm font-semibold text-[var(--text)] truncate">{report.title}</h3>
          <p className="text-xs text-[var(--muted)] mt-1 line-clamp-2">{report.summary}</p>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {report.keywords.map((kw) => (
              <span
                key={kw}
                className="text-xs px-2 py-0.5 rounded-full bg-[var(--bg)] border border-[var(--border)] text-[var(--muted)]"
              >
                {kw}
              </span>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onDelete() }}
            className="text-[var(--muted)] hover:text-red-400 p-1 rounded transition-colors"
            title="删除"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
          </button>
          <svg
            width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            className={`text-[var(--muted)] transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </div>

      {isExpanded && (
        <div className="border-t border-[var(--border)] p-4 space-y-4 animate-slideUp">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
            <div className="glass-card rounded-lg p-3 text-center">
              <div className="text-xs text-[var(--muted)] mb-1">综合评分</div>
              <div className="text-lg font-bold font-mono" style={{
                color: report.overallScore >= 70 ? '#10b981' : report.overallScore >= 50 ? '#f59e0b' : '#ef4444'
              }}>
                {report.overallScore}
              </div>
            </div>
            <div className="glass-card rounded-lg p-3 text-center">
              <div className="text-xs text-[var(--muted)] mb-1">评级</div>
              <div className={`text-lg font-bold ${getRatingColor(report.rating)}`}>
                {getRatingLabel(report.rating)}
              </div>
            </div>
            {report.targetPrice != null && (
              <div className="glass-card rounded-lg p-3 text-center">
                <div className="text-xs text-[var(--muted)] mb-1">目标价</div>
                <div className="text-lg font-bold font-mono text-blue-400">
                  {report.targetPrice.toFixed(2)}
                </div>
              </div>
            )}
            <div className="glass-card rounded-lg p-3 text-center">
              <div className="text-xs text-[var(--muted)] mb-1">因子数量</div>
              <div className="text-lg font-bold font-mono text-[var(--text)]">
                {report.factors.length}
              </div>
            </div>
          </div>

          {Object.entries(factorsByCategory).map(([cat, factors]) => (
            <div key={cat}>
              <h4 className="text-xs font-medium text-[var(--muted)] mb-2 uppercase tracking-wider">
                {getCategoryLabel(cat as ReportFactor['category'])}因子
              </h4>
              <div className="space-y-2">
                {factors.map((f, i) => (
                  <FactorBar key={`${f.name}-${i}`} factor={f} />
                ))}
              </div>
            </div>
          ))}

          <div className="text-xs text-[var(--muted)] pt-2 border-t border-[var(--border)]">
            分析时间: {new Date(report.timestamp).toLocaleString()}
          </div>
        </div>
      )}
    </div>
  )
}

export function ResearchPanel() {
  const [reports, setReports] = useState<ReportAnalysis[]>(loadReports)
  const [inputText, setInputText] = useState('')
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [analyzing, setAnalyzing] = useState(false)

  const handleAnalyze = useCallback(() => {
    if (!inputText.trim()) return
    setAnalyzing(true)
    setTimeout(() => {
      const result = analyzeReport(inputText)
      const next = [result, ...reports].slice(0, 20)
      setReports(next)
      saveReports(next)
      setInputText('')
      setExpandedId(0)
      setAnalyzing(false)
    }, 300)
  }, [inputText, reports])

  const handleLoadSample = useCallback(() => {
    setInputText(SAMPLE_REPORT)
  }, [])

  const handleDelete = useCallback((index: number) => {
    const next = reports.filter((_, i) => i !== index)
    setReports(next)
    saveReports(next)
    if (expandedId === index) setExpandedId(null)
    else if (expandedId != null && expandedId > index) setExpandedId(expandedId - 1)
  }, [reports, expandedId])

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="glass-card rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-semibold text-[var(--text)]">研报分析</h2>
            <p className="text-xs text-[var(--muted)] mt-1">
              粘贴研报内容，自动提取关键因子并计算综合评分
            </p>
          </div>
          <button
            type="button"
            onClick={handleLoadSample}
            className="btn-ghost text-xs"
          >
            加载示例研报
          </button>
        </div>

        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="在此粘贴研报内容...&#10;&#10;支持提取的因子: PE、PB、ROE、营收增速、利润增速、目标价、评级、情绪分析、风险评估等"
          rows={8}
          className="w-full input-field resize-y text-sm leading-relaxed font-mono"
        />

        <div className="flex items-center justify-between mt-3">
          <span className="text-xs text-[var(--muted)]">
            {inputText.length > 0 ? `${inputText.length} 字` : ''}
          </span>
          <button
            type="button"
            onClick={handleAnalyze}
            disabled={!inputText.trim() || analyzing}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {analyzing ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                分析中...
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                  <polyline points="10 9 9 9 8 9" />
                </svg>
                开始分析
              </>
            )}
          </button>
        </div>
      </div>

      {reports.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-[var(--muted)]">
              分析历史 ({reports.length})
            </h3>
            {reports.length > 1 && (
              <button
                type="button"
                onClick={() => { setReports([]); saveReports([]) }}
                className="text-xs text-[var(--muted)] hover:text-red-400 transition-colors"
              >
                清空全部
              </button>
            )}
          </div>
          {reports.map((report, i) => (
            <ReportCard
              key={report.timestamp}
              report={report}
              isExpanded={expandedId === i}
              onToggle={() => setExpandedId(expandedId === i ? null : i)}
              onDelete={() => handleDelete(i)}
            />
          ))}
        </div>
      )}

      {reports.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-blue-500/20 to-violet-500/20 border border-blue-500/20 flex items-center justify-center">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
          </div>
          <p className="text-sm text-[var(--muted)]">暂无分析记录</p>
          <p className="text-xs text-[var(--muted)] mt-1">粘贴研报内容后点击「开始分析」，或点击「加载示例研报」体验</p>
        </div>
      )}
    </div>
  )
}
