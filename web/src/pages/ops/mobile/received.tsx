import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { NetworkStatus, useQuery } from '@apollo/client'
import { MobileOpsCrumbBar } from 'components/mobile-ops-crumb-bar'
import { MobileOpsLiveStatus } from 'components/mobile-ops-live-status'
import { MobileOpsTaskSkeleton } from 'components/mobile-ops-task-skeleton'
import { PullToRefresh } from 'components/pull-to-refresh'
import { useLiveQueryOptions } from 'hooks/use-live-query-options'
import { useOpsRealtime } from 'hooks/use-ops-realtime'
import { MOBILE_OPS_ME } from 'lib/mobile-ops'
import { resolveInboundListQuery } from 'lib/work-mode'
import { GET_INBOUND } from 'pages/inbound/queries'
import { OrderTaskCard } from 'pages/inbound/mobile/order-task-card'
import { useTranslation } from 'react-i18next'

export default function OpsMobileReceived() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const liveOpts = useLiveQueryOptions()

  const { data, loading, refetch, networkStatus } = useQuery(GET_INBOUND, {
    ...liveOpts,
    variables: {
      type: 'PURCHASE',
      ...resolveInboundListQuery('COMPLETED'),
      input: { take: 50, skip: 0 },
    },
  })

  const refetchAll = useCallback(async () => {
    await refetch()
  }, [refetch])

  useOpsRealtime(() => void refetchAll())

  const result = data?.getInboundOrders as { orders: Array<Record<string, unknown>>; count: number } | undefined
  const orders = result?.orders ?? []
  const total = result?.count ?? 0
  const initialLoading = loading && !data
  const syncing = networkStatus === NetworkStatus.refetch

  return (
    <div className="mobile-ops-page">
      <MobileOpsCrumbBar
        title={t('已收')}
        onBack={() => navigate(MOBILE_OPS_ME)}
        backLabel={t('我的')}
        trailing={syncing ? <MobileOpsLiveStatus syncing minimal /> : undefined}
      />
      <PullToRefresh onRefresh={refetchAll}>
        <div className="mobile-ops-page-body space-y-2">
          {initialLoading && <MobileOpsTaskSkeleton />}

          {!initialLoading && orders.length === 0 && (
            <div className="mobile-ops-empty">{t('暂无已完成入库单')}</div>
          )}

          {!initialLoading &&
            orders.map((order) => (
              <OrderTaskCard
                key={String(order.id)}
                order={order}
                onOpen={() => navigate(`/inbound/${order.id}`)}
              />
            ))}

          {!initialLoading && total > orders.length && (
            <p className="py-2 text-center text-xs text-muted-foreground">
              共 {total} 单，显示前 {orders.length} 单
            </p>
          )}
        </div>
      </PullToRefresh>
    </div>
  )
}
