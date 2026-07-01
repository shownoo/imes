import { useEffect, useMemo, useState } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { useQuery, useMutation } from '@apollo/client'
import { Eye, Trash2, Pencil } from 'lucide-react'
import { PageHeader, DataTable, Button, PageCreateButton, TABLE_KEYS } from 'components/common'
import {
  OrderDateFilterField,
  OrderListFilterToolbar,
  OrderListStatusRow,
  OrderNoFilterField,
  useOrderDateFilter,
} from 'components/order-list-chrome'
import { OutboundStatusBadge } from 'components/outbound-status-badge'
import { StatusFilterBar } from 'components/status-filter-bar'
import { Tooltip, TooltipContent, TooltipTrigger } from 'components/ui/tooltip'
import { useWorkMode } from 'contexts/work-mode-context'
import { OUTBOUND_STATUS_FILTERS } from 'lib/order-status'
import {
  OUTBOUND_OPERATIONS_DEFAULT_STATUS,
  OUTBOUND_OPERATIONS_STATUS_FILTERS,
  resolveOutboundListQuery,
  shouldShowOrderCreate,
} from 'lib/work-mode'
import { formatDate } from 'lib/utils'
import { GET_OUTBOUND, DEL } from './queries'

import { useMobileOpsUi } from 'hooks/use-mobile-ops-ui'
import { MOBILE_OPS_SHIP } from 'lib/mobile-ops'

const OUTBOUND_TITLE_TIP = '申请 → 审核 → FIFO拣货 → 拆零确认 → 出库完成'

export default function OutboundIndex() {
  const mobileOps = useMobileOpsUi()
  if (mobileOps) return <Navigate to={MOBILE_OPS_SHIP} replace />

  return <OutboundDesktopIndex />
}

function OutboundDesktopIndex() {
  const navigate = useNavigate()
  const { mode } = useWorkMode()
  const isOperations = mode === 'operations'
  const [statusFilter, setStatusFilter] = useState(
    isOperations ? OUTBOUND_OPERATIONS_DEFAULT_STATUS : 'all',
  )
  const [orderNo, setOrderNo] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const { onDateRangeChange, ...dateVars } = useOrderDateFilter()

  const refetchOpts = { refetchQueries: ['GetOutboundOrders'] }
  const { data, loading, refetch } = useQuery(GET_OUTBOUND, {
    variables: {
      ...resolveOutboundListQuery(statusFilter),
      orderNo: orderNo || undefined,
      ...dateVars,
      input: { take: pageSize, skip: (page - 1) * pageSize },
    },
  })
  const [delOrder] = useMutation(DEL, refetchOpts)

  const outboundResult = data?.getOutboundOrders as { orders: Array<Record<string, unknown>>; count: number } | undefined
  const orders = outboundResult?.orders ?? []
  const total = outboundResult?.count ?? 0

  useEffect(() => {
    setStatusFilter(isOperations ? OUTBOUND_OPERATIONS_DEFAULT_STATUS : 'all')
    setPage(1)
  }, [mode, isOperations])

  useEffect(() => {
    setPage(1)
  }, [statusFilter, orderNo, dateVars.dateFrom, dateVars.dateTo])

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: total }
    for (const o of orders) {
      const s = String(o.status)
      counts[s] = (counts[s] ?? 0) + 1
    }
    return counts
  }, [orders, total])

  const statusOptions = isOperations ? OUTBOUND_OPERATIONS_STATUS_FILTERS : OUTBOUND_STATUS_FILTERS

  return (
    <div>
      <PageHeader
        title="出库管理"
        titleTip={OUTBOUND_TITLE_TIP}
        desc={isOperations ? '仅显示已审核、可拣货出库的单据' : undefined}
      />

      <OrderListFilterToolbar
        trailing={
          shouldShowOrderCreate(mode) ? (
            <PageCreateButton label="新建" onClick={() => navigate('/outbound/create')} />
          ) : undefined
        }
      >
        <OrderNoFilterField onSearch={setOrderNo} />
        <OrderDateFilterField onChange={onDateRangeChange} />
      </OrderListFilterToolbar>

      <OrderListStatusRow>
        <StatusFilterBar
          value={statusFilter}
          options={statusOptions}
          onChange={setStatusFilter}
          counts={statusFilter === 'all' ? statusCounts : undefined}
        />
      </OrderListStatusRow>

      <DataTable
        tableKey={TABLE_KEYS.OUTBOUND_MASTER}
        loading={loading}
        columns={[
          {
            key: 'orderNo',
            title: '单号',
            tip: '系统自动生成的出库单编号',
          },
          {
            key: 'status',
            title: '状态',
            tip: '当前所处流程节点',
            render: (r) => (
              <OutboundStatusBadge
                order={{
                  status: r.status,
                  lines: (r.lines as Array<{ requestedQty: number; pickedQty?: number | null }>) ?? [],
                }}
                compact
              />
            ),
          },
          { key: 'purpose', title: '用途', tip: '调拨或发放用途说明', render: (r) => String(r.purpose ?? '—') },
          { key: 'destination', title: '领用人', tip: '物资领取单位', render: (r) => String(r.destination ?? '—') },
          {
            key: 'plannedShipDate',
            title: '计划发货',
            tip: '计划完成出库的日期',
            render: (r) => (r.plannedShipDate ? formatDate(String(r.plannedShipDate)) : '—'),
          },
          { key: 'lines', title: '明细', tip: '申请出库的物资行数', render: (r) => `${(r.lines as unknown[])?.length ?? 0} 项` },
          { key: 'createdAt', title: '创建时间', tip: '单据首次创建时间', render: (r) => formatDate(String(r.createdAt)) },
          {
            key: 'action',
            title: '操作',
            render: (r) => (
              <div className="flex gap-0.5">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="size-7" onClick={() => navigate(`/outbound/${r.id}`)}>
                      <Eye className="size-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>详情</TooltipContent>
                </Tooltip>
                {r.status === 'DRAFT' && (
                  <>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="size-7" onClick={() => navigate(`/outbound/${r.id}/edit`)}>
                          <Pencil className="size-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>编辑</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="size-7 text-destructive" onClick={async () => { if (confirm('确认删除？')) await delOrder({ variables: { input: { id: r.id } } }) }}>
                          <Trash2 className="size-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>删除</TooltipContent>
                    </Tooltip>
                  </>
                )}
                {r.status === 'REJECTED' && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="size-7 text-destructive" onClick={async () => { if (confirm('确认删除？')) await delOrder({ variables: { input: { id: r.id } } }) }}>
                        <Trash2 className="size-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>删除</TooltipContent>
                  </Tooltip>
                )}
              </div>
            ),
          },
        ]}
        rows={orders}
        total={total}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={(size) => {
          setPageSize(size)
          setPage(1)
        }}
        onRefresh={() => void refetch()}
      />
    </div>
  )
}
