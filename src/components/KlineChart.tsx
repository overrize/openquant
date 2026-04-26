import { useEffect, useMemo, useRef } from 'react'
import { createChart, ColorType } from 'lightweight-charts'
import type { CandlestickData, Time } from 'lightweight-charts'
import type { KlineBar } from '../api/kline'

interface KlineChartProps {
  data: KlineBar[]
  height?: number
}

/** 过滤无效 K 线（保证 open/high/low/close 为有效正数） */
function filterValidBars(bars: KlineBar[]): KlineBar[] {
  return bars.filter(
    (b) =>
      Number.isFinite(b.open) &&
      Number.isFinite(b.high) &&
      Number.isFinite(b.low) &&
      Number.isFinite(b.close) &&
      b.open > 0 &&
      b.high > 0 &&
      b.low > 0 &&
      b.close > 0 &&
      b.time
  )
}

/** 日 K 用 BusinessDay，分时用 Unix 秒，供 lightweight-charts 使用 */
function toChartPoint(b: { time: string | number; open: number; high: number; low: number; close: number }) {
  const time =
    typeof b.time === 'number'
      ? b.time
      : b.time.length >= 10
        ? {
            year: parseInt(b.time.slice(0, 4), 10),
            month: parseInt(b.time.slice(5, 7), 10),
            day: parseInt(b.time.slice(8, 10), 10),
          }
        : (b.time as string)
  return { time, open: b.open, high: b.high, low: b.low, close: b.close }
}

export function KlineChart({ data, height = 360 }: KlineChartProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<ReturnType<typeof createChart> | null>(null)
  const seriesRef = useRef<ReturnType<ReturnType<typeof createChart>['addCandlestickSeries']> | null>(null)
  const dataLengthRef = useRef(0)
  const validData = useMemo(() => filterValidBars(data), [data])

  useEffect(() => {
    if (!containerRef.current) return
    if (validData.length === 0) {
      chartRef.current?.remove()
      chartRef.current = null
      seriesRef.current = null
      return
    }

    const el = containerRef.current
    const formatted = validData.map(toChartPoint)
    const isIntraday = validData.length > 0 && typeof validData[0].time === 'number'

    if (chartRef.current && seriesRef.current) {
      try {
        chartRef.current.timeScale().applyOptions({ secondsVisible: isIntraday })
        const prevLen = dataLengthRef.current
        seriesRef.current.setData(formatted as CandlestickData<Time>[])
        dataLengthRef.current = formatted.length
        if (formatted.length !== prevLen) {
          chartRef.current.timeScale().fitContent()
        }
      } catch (err) {
        console.error('Kline setData error', err)
      }
      return
    }

    let chart: ReturnType<typeof createChart> | null = null
    let cleanup: (() => void) | null = null

    const init = () => {
      const w = el.clientWidth || el.parentElement?.clientWidth || 600
      if (w <= 0) return
      chart = createChart(el, {
        layout: {
          background: { type: ColorType.Solid, color: '#ffffff' },
          textColor: '#605a4a',
        },
        grid: { vertLines: { color: '#ebe9e1' }, horzLines: { color: '#ebe9e1' } },
        width: Math.max(w, 400),
        height,
        rightPriceScale: { borderColor: '#ddd9cc', scaleMargins: { top: 0.1, bottom: 0.2 } },
        timeScale: {
          borderColor: '#ddd9cc',
          timeVisible: true,
          secondsVisible: isIntraday,
          barSpacing: 12,
          tickMarkFormatter: (time: unknown) => {
            if (typeof time === 'object' && time !== null && 'year' in time && 'month' in time && 'day' in time) {
              const t = time as { year: number; month: number; day: number }
              const yy = String(t.year).slice(-2)
              return `${yy}-${t.month.toString().padStart(2, '0')}-${t.day.toString().padStart(2, '0')}`
            }
            if (typeof time === 'number') {
              const d = new Date(time * 1000)
              if (isIntraday) {
                return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
              }
              const yy = String(d.getFullYear()).slice(-2)
              return `${yy}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`
            }
            return ''
          },
        },
      })
      chartRef.current = chart

      const candleSeries = chart.addCandlestickSeries({
        upColor: '#0d7a6b',
        downColor: '#b83565',
        borderUpColor: '#0d7a6b',
        borderDownColor: '#b83565',
        wickUpColor: '#0d7a6b',
        wickDownColor: '#b83565',
      })
      seriesRef.current = candleSeries

      try {
        candleSeries.setData(formatted as CandlestickData<Time>[])
        dataLengthRef.current = formatted.length
        chart.timeScale().fitContent()
      } catch (err) {
        console.error('Kline setData error', err)
        chart.remove()
        chartRef.current = null
        seriesRef.current = null
        return
      }

      const handleResize = () => {
        if (el.parentElement) {
          const width = el.clientWidth || el.parentElement.clientWidth
          if (width > 0) chart?.applyOptions({ width })
        }
      }
      window.addEventListener('resize', handleResize)
      const ro = new ResizeObserver(handleResize)
      ro.observe(el)
      cleanup = () => {
        ro.disconnect()
        window.removeEventListener('resize', handleResize)
      }
    }

    const id = setTimeout(init, 80)
    return () => {
      clearTimeout(id)
      cleanup?.()
    }
  }, [validData, height])

  useEffect(() => {
    return () => {
      chartRef.current?.remove()
      chartRef.current = null
      seriesRef.current = null
    }
  }, [])

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center text-[var(--muted)]" style={{ height }}>
        暂无 K 线数据
      </div>
    )
  }

  if (validData.length === 0) {
    return (
      <div className="flex items-center justify-center text-[var(--muted)]" style={{ height }}>
        数据格式异常，无法绘制
      </div>
    )
  }

  return (
    <div ref={containerRef} className="w-full min-w-0" style={{ height, minHeight: height }} />
  )
}
