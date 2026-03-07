/**
 * 要约收购套利：拉取 SEC 申报列表 + 股价，用于展示与价差估算
 */

import { useCallback, useState, useEffect } from 'react'
import {
  fetchRecentTenderOfferFilings,
  fetchSecCompanyTickers,
  mergeTickers,
  fetchFinnhubQuote,
  type TenderOfferItem,
} from '../api/tenderOffer'

export function useTenderOffers(finnhubApiKey: string | null) {
  const [list, setList] = useState<TenderOfferItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadFilings = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [filings, cikToTicker] = await Promise.all([
        fetchRecentTenderOfferFilings(),
        fetchSecCompanyTickers(),
      ])
      const merged = mergeTickers(filings, cikToTicker)
      setList(merged)
    } catch (e) {
      setError(e instanceof Error ? e.message : '获取 SEC 申报失败')
      setList([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadFilings()
  }, [loadFilings])

  /** 为已加载的列表拉取当前股价（需 Finnhub Key） */
  const refreshPrices = useCallback(async () => {
    if (!finnhubApiKey || list.length === 0) return
    setLoading(true)
    setError(null)
    try {
      const next = await Promise.all(
        list.map(async (item) => {
          const price = await fetchFinnhubQuote(item.ticker, finnhubApiKey)
          const spread =
            item.offerPrice != null && price != null && price > 0
              ? ((item.offerPrice - price) / price) * 100
              : undefined
          return { ...item, currentPrice: price ?? item.currentPrice, spreadPct: spread ?? item.spreadPct }
        })
      )
      setList(next)
    } catch (e) {
      setError(e instanceof Error ? e.message : '获取股价失败')
    } finally {
      setLoading(false)
    }
  }, [finnhubApiKey, list])

  return { list, loading, error, refreshFilings: loadFilings, refreshPrices }
}
