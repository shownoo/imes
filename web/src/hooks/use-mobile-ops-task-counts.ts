import { useCallback } from 'react'
import { useQuery } from '@apollo/client'
import { GET_INBOUND } from 'pages/inbound/queries'
import { GET_OUTBOUND } from 'pages/outbound/queries'
import { countInboundReceiveOverdue, countOutboundShipOverdue } from 'lib/mobile-ops-task-urgency'
import { resolveInboundListQuery, resolveOutboundListQuery } from 'lib/work-mode'
import { useLiveQueryOptions } from './use-live-query-options'
import { useOpsRealtime } from './use-ops-realtime'

const OPS_TAB_LIST_TAKE = 50

/** 底部 Tab 徽章：待收货 / 待发货单数（与待办列表同源） */
export function useMobileOpsTaskCounts() {
  const liveOpts = useLiveQueryOptions()

  const inboundQuery = useQuery(GET_INBOUND, {
    ...liveOpts,
    variables: {
      type: 'PURCHASE',
      ...resolveInboundListQuery('RECEIVING'),
      input: { take: OPS_TAB_LIST_TAKE, skip: 0 },
    },
  })

  const outboundQuery = useQuery(GET_OUTBOUND, {
    ...liveOpts,
    variables: {
      ...resolveOutboundListQuery('active'),
      input: { take: OPS_TAB_LIST_TAKE, skip: 0 },
    },
  })

  const refetch = useCallback(async () => {
    await Promise.all([inboundQuery.refetch(), outboundQuery.refetch()])
  }, [inboundQuery, outboundQuery])

  useOpsRealtime(() => void refetch())

  const inboundResult = inboundQuery.data?.getInboundOrders as
    | { orders?: Array<Record<string, unknown>>; count?: number }
    | undefined
  const outboundResult = outboundQuery.data?.getOutboundOrders as
    | { orders?: Array<Record<string, unknown>>; count?: number }
    | undefined

  const receiveOrders = inboundResult?.orders ?? []
  const shipOrders = outboundResult?.orders ?? []

  return {
    receiveCount: inboundResult?.count ?? 0,
    shipCount: outboundResult?.count ?? 0,
    receiveOverdueCount: countInboundReceiveOverdue(receiveOrders),
    shipOverdueCount: countOutboundShipOverdue(shipOrders),
  }
}
