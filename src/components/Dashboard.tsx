import type { TickerRow } from '../types'
import { TickerRow as TickerRowComponent } from './TickerRow'

interface DashboardProps {
  stockList: TickerRow[]
  cryptoList: TickerRow[]
  cnStockList: TickerRow[]
}

export function Dashboard({ stockList, cryptoList, cnStockList }: DashboardProps) {
  return (
    <div className="grid gap-6 md:grid-cols-3 max-w-7xl mx-auto">
      <section className="bg-[var(--panel)] rounded-xl border border-[var(--border)] overflow-hidden">
        <div className="px-4 py-3 border-b border-[var(--border)]">
          <h2 className="text-sm font-semibold text-[var(--muted)] uppercase tracking-wider">
            美股
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs text-[var(--muted)] border-b border-[var(--border)]">
                <th className="py-2.5 px-3">代码</th>
                <th className="py-2.5 px-3 text-right">价格</th>
                <th className="py-2.5 px-3 text-right">涨跌幅</th>
              </tr>
            </thead>
            <tbody>
              {stockList.map((row) => (
                <TickerRowComponent key={row.id} row={row} />
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="bg-[var(--panel)] rounded-xl border border-[var(--border)] overflow-hidden">
        <div className="px-4 py-3 border-b border-[var(--border)]">
          <h2 className="text-sm font-semibold text-[var(--muted)] uppercase tracking-wider">
            A股（东方财富）
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs text-[var(--muted)] border-b border-[var(--border)]">
                <th className="py-2.5 px-3">代码 / 名称</th>
                <th className="py-2.5 px-3 text-right">价格</th>
                <th className="py-2.5 px-3 text-right">涨跌幅</th>
              </tr>
            </thead>
            <tbody>
              {cnStockList.map((row) => (
                <TickerRowComponent key={row.id} row={row} showName />
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="bg-[var(--panel)] rounded-xl border border-[var(--border)] overflow-hidden">
        <div className="px-4 py-3 border-b border-[var(--border)]">
          <h2 className="text-sm font-semibold text-[var(--muted)] uppercase tracking-wider">
            加密货币
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs text-[var(--muted)] border-b border-[var(--border)]">
                <th className="py-2.5 px-3">交易对</th>
                <th className="py-2.5 px-3 text-right">价格</th>
                <th className="py-2.5 px-3 text-right">涨跌幅</th>
              </tr>
            </thead>
            <tbody>
              {cryptoList.map((row) => (
                <TickerRowComponent key={row.id} row={row} />
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
