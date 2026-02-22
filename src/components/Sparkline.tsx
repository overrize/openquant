/** 缩略 K 线：根据近期价格序列画折线，涨绿跌红。points 须为时间正序 [最早, ..., 最新]，右侧为最新价。 */
interface SparklineProps {
  points: number[]
  width?: number
  height?: number
  className?: string
}

export function Sparkline({
  points,
  width = 80,
  height = 28,
  className = '',
}: SparklineProps) {
  const pts = points.slice(-60)
  if (!pts.length) return <span className={className} style={{ width, height, display: 'inline-block' }}>—</span>
  if (pts.length === 1) {
    const isUp = true
    return (
      <svg className={className} width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <line x1={0} y1={height / 2} x2={width} y2={height / 2} stroke={isUp ? '#22c55e' : '#ef4444'} strokeWidth={1} />
      </svg>
    )
  }
  const min = Math.min(...pts)
  const max = Math.max(...pts)
  const range = max - min || 1
  const padding = 2
  const w = width - padding * 2
  const h = height - padding * 2
  const step = pts.length > 1 ? w / (pts.length - 1) : 0
  const toX = (i: number) => padding + i * step
  const toY = (v: number) => padding + h - ((v - min) / range) * h
  const d = pts.map((v, i) => `${i === 0 ? 'M' : 'L'} ${toX(i)} ${toY(v)}`).join(' ')
  const isUp = pts[pts.length - 1]! >= pts[0]!
  const stroke = isUp ? '#22c55e' : '#ef4444'
  return (
    <svg className={className} width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <path d={d} fill="none" stroke={stroke} strokeWidth={1.2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
