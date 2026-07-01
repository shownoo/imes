import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { NetworkStatus, useQuery } from '@apollo/client'
import { Search } from 'lucide-react'
import { Input } from 'components/ui/input'
import { MobileOpsLiveStatus } from 'components/mobile-ops-live-status'
import { MobileOpsTaskSkeleton } from 'components/mobile-ops-task-skeleton'
import { PullToRefresh } from 'components/pull-to-refresh'
import { useWorkMode } from 'contexts/work-mode-context'
import { useLiveQueryOptions } from 'hooks/use-live-query-options'
import {
  INBOUND_OPERATIONS_DEFAULT_STATUS,
  INBOUND_OPERATIONS_STATUS_FILTERS,
  resolveInboundListQuery,
} from 'lib/work-mode'
import { GET_INBOUND } from '../queries'
import { OrderTaskCard } from './order-task-card'
import { cn } from 'lib/utils'

const STATUS_LABELS: Record<string, string> = {
  RECEIVING: '收货中',
  COMPLETED: '已完成',
}

export default function InboundMobileList() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { mode } = useWorkMode()
  const isOperations = mode === 'operations'
  const [statusFilter, setStatusFilter] = useState(
    isOperations ? INBOUND_OPERATIONS_DEFAULT_STATUS : 'RECEIVING',
  )
  const [orderNo, setOrderNo] = useState('')
  const [search, setSearch] = useState('')
  const liveOpts = useLiveQueryOptions()

  useEffect(() => {
    const t = window.setTimeout(() => setOrderNo(search.trim()), 300)
    return () => window.clearTimeout(t)
  }, [search])

  const { data, loading, refetch, networkStatus } = useQuery(GET_INBOUND, {
    ...liveOpts,
    variables: {
      type: 'PURCHASE',
      ...resolveInboundListQuery(statusFilter),
      orderNo: orderNo || undefined,
      input: { take: 50, skip: 0 },
    },
  })

  const inboundResult = data?.getInboundOrders as { orders: Array<Record<string, unknown>>; count: number } | undefined
  const orders = inboundResult?.orders ?? []
  const total = inboundResult?.count ?? 0
  const initialLoading = loading && !data
  const syncing = networkStatus === NetworkStatus.refetch

  const statusOptions = isOperations ? INBOUND_OPERATIONS_STATUS_FILTERS : (['RECEIVING', 'COMPLETED'] as const)

  const emptyHint = useMemo(() => {
    if (statusFilter === 'RECEIVING') return '暂无待收货单据，请等待主管审核通过'
    return '暂无已完成入库单'
  }, [statusFilter])

  const handleRefresh = useCallback(() => refetch(), [refetch])

  return (
    <div className="mobile-ops-page">
      <header className="mobile-ops-page-header">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="mobile-ops-page-title text-[28px]">{t('收货任务')}</h1>
            <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[13px] text-muted-foreground">
              <span>{t('选单 → 清点赋码 → 扫码上架')}</span>
              <span aria-hidden className="text-border">
                ·
              </span>
              <MobileOpsLiveStatus syncing={syncing} />
            </p>
          </div>
        </div>

        <div className="relative mt-3">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('搜索采购单号')}
            className="h-10 rounded-[10px] border-0 bg-[rgba(118,118,128,0.12)] pl-9 text-[17px] shadow-none placeholder:text-[rgba(60,60,67,0.3)]"
          />
        </div>

        <div className="mobile-ops-segment mt-3" role="tablist">
          {statusOptions.map((status) => (
            <button
              key={status}
              type="button"
              role="tab"
              aria-selected={statusFilter === status}
              className={cn('mobile-ops-segment-item', statusFilter === status && 'mobile-ops-segment-item--active')}
              onClick={() => setStatusFilter(status)}
            >
              {STATUS_LABELS[status] ?? status}
            </button>
          ))}
        </div>
      </header>

      <PullToRefresh onRefresh={handleRefresh}>
        <div className="mobile-ops-page-body space-y-2">
          {initialLoading && <MobileOpsTaskSkeleton />}

          {!initialLoading && orders.length === 0 && <div className="mobile-ops-empty">{emptyHint}</div>}

          {!initialLoading &&
            orders.map((order) => (
              <OrderTaskCard
                key={String(order.id)}
                order={order}
                onOpen={() => navigate(`/inbound/${order.id}`)}
              />
            ))}

          {!initialLoading && total > orders.length && (
            <p className="py-2 text-center text-xs text-muted-foreground">共 {total} 单，显示前 {orders.length} 单</p>
          )}
        </div>
      </PullToRefresh>
    </div>
  )
}
