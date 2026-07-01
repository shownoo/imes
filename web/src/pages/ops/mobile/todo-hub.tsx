import { useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { NetworkStatus, useQuery } from '@apollo/client'
import { MobileOpsLiveStatus } from 'components/mobile-ops-live-status'
import { MobileOpsCrumbBar } from 'components/mobile-ops-crumb-bar'
import { MobileOpsTaskSkeleton } from 'components/mobile-ops-task-skeleton'
import { PullToRefresh } from 'components/pull-to-refresh'
import { useLiveQueryOptions } from 'hooks/use-live-query-options'
import { useOpsRealtime } from 'hooks/use-ops-realtime'
import { GET_INBOUND } from 'pages/inbound/queries'
import { GET_OUTBOUND } from 'pages/outbound/queries'
import { OrderTaskCard } from 'pages/inbound/mobile/order-task-card'
import { OutboundTaskCard } from './outbound-task-card'
import { parseMobileTodoTab } from 'lib/mobile-ops'
import { resolveInboundListQuery, resolveOutboundListQuery } from 'lib/work-mode'
import { useTranslation } from 'react-i18next'

export default function OpsTodoHub() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const tab = parseMobileTodoTab(params.get('tab'))
  const liveOpts = useLiveQueryOptions()

  const inboundQuery = useQuery(GET_INBOUND, {
    ...liveOpts,
    variables: {
      type: 'PURCHASE',
      ...resolveInboundListQuery('RECEIVING'),
      input: { take: 50, skip: 0 },
    },
  })

  const outboundQuery = useQuery(GET_OUTBOUND, {
    ...liveOpts,
    variables: {
      ...resolveOutboundListQuery('active'),
      input: { take: 50, skip: 0 },
    },
  })

  const initialLoading =
    (tab === 'receive' ? inboundQuery.loading : outboundQuery.loading) &&
    !(tab === 'receive' ? inboundQuery.data : outboundQuery.data)

  const syncing =
    inboundQuery.networkStatus === NetworkStatus.refetch ||
    outboundQuery.networkStatus === NetworkStatus.refetch

  const refetchAll = useCallback(async () => {
    await Promise.all([inboundQuery.refetch(), outboundQuery.refetch()])
  }, [inboundQuery, outboundQuery])

  useOpsRealtime(() => void refetchAll())

  const inboundResult = inboundQuery.data?.getInboundOrders as
    | { orders: Array<Record<string, unknown>>; count: number }
    | undefined
  const outboundResult = outboundQuery.data?.getOutboundOrders as
    | { orders: Array<Record<string, unknown>>; count: number }
    | undefined

  const receiveOrders = inboundResult?.orders ?? []
  const receiveTotal = inboundResult?.count ?? 0
  const shipOrders = outboundResult?.orders ?? []
  const shipTotal = outboundResult?.count ?? 0

  const activeOrders = tab === 'receive' ? receiveOrders : shipOrders
  const activeTotal = tab === 'receive' ? receiveTotal : shipTotal
  const pageTitle = tab === 'receive' ? t('收货') : t('发货')
  const emptyHint =
    tab === 'receive' ? t('暂无收货任务，审核通过后会出现在这里') : t('暂无发货任务，审核通过后会出现在这里')

  return (
    <div className="mobile-ops-page mobile-ops-page--tab-root">
      <MobileOpsCrumbBar
        title={pageTitle}
        trailing={syncing ? <MobileOpsLiveStatus syncing minimal /> : undefined}
      />
      <PullToRefresh onRefresh={refetchAll}>
        <div className="mobile-ops-page-body space-y-2">
          {initialLoading && <MobileOpsTaskSkeleton />}

          {!initialLoading && activeOrders.length === 0 && <div className="mobile-ops-empty">{emptyHint}</div>}

          {!initialLoading &&
            tab === 'receive' &&
            receiveOrders.map((order) => (
              <OrderTaskCard
                key={String(order.id)}
                order={order}
                onOpen={() => navigate(`/inbound/${order.id}`)}
              />
            ))}

          {!initialLoading &&
            tab === 'ship' &&
            shipOrders.map((order) => (
              <OutboundTaskCard
                key={String(order.id)}
                order={order}
                onOpen={() => navigate(`/outbound/${order.id}`)}
              />
            ))}

          {!initialLoading && activeTotal > activeOrders.length && (
            <p className="py-2 text-center text-xs text-muted-foreground">
              共 {activeTotal} 单，显示前 {activeOrders.length} 单
            </p>
          )}
        </div>
      </PullToRefresh>
    </div>
  )
}
