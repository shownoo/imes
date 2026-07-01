import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@apollo/client'
import { Eye, Trash2 } from 'lucide-react'
import { PageHeader, DataTable, Badge, Button, PageCreateButton, TABLE_KEYS } from 'components/common'
import {
  OrderDateFilterField,
  OrderListFilterToolbar,
  OrderListStatusRow,
  OrderNoFilterField,
  useOrderDateFilter,
} from 'components/order-list-chrome'
import { ListFilterField } from 'components/list-filter-toolbar'
import { InboundStatusBadge } from 'components/inbound-status-badge'
import { StatusFilterBar } from 'components/status-filter-bar'
import { WarehouseFilter } from 'components/warehouse-filter'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from 'components/ui/select'
import { Tooltip, TooltipContent, TooltipTrigger } from 'components/ui/tooltip'
import { useWorkMode } from 'contexts/work-mode-context'
import { INBOUND_STATUS_FILTERS } from 'lib/order-status'
import {
  INBOUND_OPERATIONS_DEFAULT_STATUS,
  INBOUND_OPERATIONS_STATUS_FILTERS,
  resolveInboundListQuery,
  shouldShowOrderCreate,
} from 'lib/work-mode'
import { listFilterSelectTriggerClass } from 'lib/list-index-chrome'
import { INBOUND_TYPE_LABELS, formatDate } from 'lib/utils'
import { GET_INBOUND, GET_WAREHOUSES, GET_SUPPLIERS, DEL } from './queries'
import { useMobileOpsUi } from 'hooks/use-mobile-ops-ui'
import { Navigate } from 'react-router-dom'
import { MOBILE_OPS_HOME } from 'lib/mobile-ops'

const INBOUND_TITLE_TIP = '选单清点 → 批次效期 → 蓝牙赋码 → 扫码上架'

export default function InboundIndex() {
  const mobileOps = useMobileOpsUi()
  if (mobileOps) return <Navigate to={MOBILE_OPS_HOME} replace />

  return <InboundDesktopIndex />
}

function InboundDesktopIndex() {
  const navigate = useNavigate()
  const { mode } = useWorkMode()
  const isOperations = mode === 'operations'
  const [statusFilter, setStatusFilter] = useState(
    isOperations ? INBOUND_OPERATIONS_DEFAULT_STATUS : 'all',
  )
  const [warehouseFilter, setWarehouseFilter] = useState('all')
  const [orderNo, setOrderNo] = useState('')
  const [supplierFilter, setSupplierFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const { onDateRangeChange, ...dateVars } = useOrderDateFilter()

  const refetchOpts = { refetchQueries: ['GetInboundOrders'] }
  const { data: whData } = useQuery(GET_WAREHOUSES)
  const { data: supData } = useQuery(GET_SUPPLIERS, { variables: { input: { take: 200 } } })
  const { data, loading, refetch } = useQuery(GET_INBOUND, {
    variables: {
      type: 'PURCHASE',
      ...resolveInboundListQuery(statusFilter),
      warehouseId: warehouseFilter === 'all' ? undefined : warehouseFilter,
      orderNo: orderNo || undefined,
      supplierId: supplierFilter === 'all' ? undefined : supplierFilter,
      ...dateVars,
      input: { take: pageSize, skip: (page - 1) * pageSize },
    },
  })
  const [delOrder] = useMutation(DEL, refetchOpts)

  const warehouses = (whData?.getWarehouses as { warehouses: Array<{ id: string; name: string }> })?.warehouses ?? []
  const suppliers = (supData?.getSuppliers as { suppliers: Array<{ id: string; name: string }> })?.suppliers ?? []
  const inboundResult = data?.getInboundOrders as { orders: Array<Record<string, unknown>>; count: number } | undefined
  const orders = inboundResult?.orders ?? []
  const total = inboundResult?.count ?? 0

  useEffect(() => {
    setStatusFilter(isOperations ? INBOUND_OPERATIONS_DEFAULT_STATUS : 'all')
    setPage(1)
  }, [mode, isOperations])

  useEffect(() => {
    setPage(1)
  }, [statusFilter, warehouseFilter, orderNo, supplierFilter, dateVars.dateFrom, dateVars.dateTo])

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: total }
    for (const o of orders) {
      const s = String(o.status)
      counts[s] = (counts[s] ?? 0) + 1
    }
    return counts
  }, [orders, total])

  const statusOptions = isOperations ? INBOUND_OPERATIONS_STATUS_FILTERS : INBOUND_STATUS_FILTERS

  return (
    <div>
      <PageHeader
        title="采购入库"
        titleTip={INBOUND_TITLE_TIP}
        desc={isOperations ? '仅显示已审核、可收货的单据' : undefined}
      />

      <OrderListFilterToolbar
        trailing={
          shouldShowOrderCreate(mode) ? (
            <PageCreateButton label="新建" onClick={() => navigate('/inbound/create')} />
          ) : undefined
        }
      >
        <OrderNoFilterField onSearch={setOrderNo} />
        <ListFilterField variant="corp">
          <Select value={supplierFilter} onValueChange={setSupplierFilter}>
            <SelectTrigger className={listFilterSelectTriggerClass}>
              <SelectValue placeholder="供应商" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部供应商</SelectItem>
              {suppliers.map((s) => (
                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </ListFilterField>
        <OrderDateFilterField placeholder="创建日期" onChange={onDateRangeChange} />
      </OrderListFilterToolbar>

      <OrderListStatusRow
        trailing={
          <WarehouseFilter
            value={warehouseFilter}
            onChange={setWarehouseFilter}
            warehouses={warehouses}
            label="仓库"
          />
        }
      >
        <StatusFilterBar
          value={statusFilter}
          options={statusOptions}
          onChange={setStatusFilter}
          counts={statusFilter === 'all' ? statusCounts : undefined}
        />
      </OrderListStatusRow>

      <DataTable
        tableKey={TABLE_KEYS.INBOUND_PURCHASE_MASTER}
        loading={loading}
        columns={[
          {
            key: 'orderNo',
            title: '采购单号',
            tip: '系统自动生成的采购入库单编号',
          },
          { key: 'type', title: '类型', tip: '当前仅支持采购入库', render: () => <Badge variant="info">{INBOUND_TYPE_LABELS.PURCHASE}</Badge> },
          {
            key: 'status',
            title: '状态',
            tip: '当前所处流程节点',
            render: (r) => (
              <InboundStatusBadge
                order={{
                  status: r.status,
                  lines: (r.lines as Array<{ expectedQty: number; actualQty?: number | null }>) ?? [],
                }}
                compact
              />
            ),
          },
          {
            key: 'warehouse',
            title: '收货仓库',
            tip: '本单计划入库的物理库房',
            render: (r) => (r.warehouse as { name?: string })?.name ?? '—',
          },
          { key: 'supplier', title: '供应商', tip: '物资供货方', render: (r) => (r.supplier as { name?: string })?.name ?? '—' },
          { key: 'contractNo', title: '合同号', tip: '关联采购合同编号', render: (r) => String(r.contractNo ?? '—') },
          { key: 'lines', title: '明细', tip: '入库物资行数', render: (r) => `${(r.lines as unknown[])?.length ?? 0} 项` },
          { key: 'createdAt', title: '创建日期', tip: '单据业务日期', render: (r) => formatDate(String(r.orderDate ?? r.createdAt)) },
          {
            key: 'action',
            title: '操作',
            render: (r) => (
              <div className="flex gap-0.5">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="size-7" onClick={() => navigate(`/inbound/${r.id}`)}>
                      <Eye className="size-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>详情</TooltipContent>
                </Tooltip>
                {r.status === 'DRAFT' && (
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

