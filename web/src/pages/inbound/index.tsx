import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@apollo/client'
import { Eye, Trash2 } from 'lucide-react'
import { PageHeader, DataTable, Badge, Button, PageCreateButton } from 'components/common'
import { StatusBadge } from 'components/status-badge'
import { StatusFilterBar } from 'components/status-filter-bar'
import { WarehouseFilter } from 'components/warehouse-filter'
import { Tooltip, TooltipContent, TooltipTrigger } from 'components/ui/tooltip'
import { INBOUND_STATUS_FILTERS } from 'lib/order-status'
import { INBOUND_TYPE_LABELS, formatDate } from 'lib/utils'
import { GET_INBOUND, GET_WAREHOUSES, DEL } from './queries'

const INBOUND_TITLE_TIP = '选单清点 → 批次效期 → 蓝牙赋码 → 扫码上架'

export default function InboundIndex() {
  const navigate = useNavigate()
  const [statusFilter, setStatusFilter] = useState('all')
  const [warehouseFilter, setWarehouseFilter] = useState('all')

  const refetchOpts = { refetchQueries: ['GetInboundOrders'] }
  const { data: whData } = useQuery(GET_WAREHOUSES)
  const { data, loading } = useQuery(GET_INBOUND, {
    variables: {
      type: 'PURCHASE',
      status: statusFilter === 'all' ? undefined : statusFilter,
      warehouseId: warehouseFilter === 'all' ? undefined : warehouseFilter,
      input: { take: 50 },
    },
  })
  const [delOrder] = useMutation(DEL, refetchOpts)

  const warehouses = (whData?.getWarehouses as { warehouses: Array<{ id: string; name: string }> })?.warehouses ?? []
  const orders = (data?.getInboundOrders as { orders: Array<Record<string, unknown>> })?.orders ?? []

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: orders.length }
    for (const o of orders) {
      const s = String(o.status)
      counts[s] = (counts[s] ?? 0) + 1
    }
    return counts
  }, [orders])

  return (
    <div>
      <PageHeader
        title="采购入库"
        titleTip={INBOUND_TITLE_TIP}
        action={<PageCreateButton label="新建" onClick={() => navigate('/inbound/create')} />}
      />

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <StatusFilterBar
          value={statusFilter}
          options={INBOUND_STATUS_FILTERS}
          onChange={setStatusFilter}
          counts={statusFilter === 'all' ? statusCounts : undefined}
        />
        <WarehouseFilter
          value={warehouseFilter}
          onChange={setWarehouseFilter}
          warehouses={warehouses}
          label="仓库"
        />
      </div>

      <DataTable
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
            render: (r) => <StatusBadge status={String(r.status)} compact />,
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
          { key: 'createdAt', title: '创建时间', tip: '单据首次创建时间', render: (r) => formatDate(String(r.createdAt)) },
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
      />
    </div>
  )
}
