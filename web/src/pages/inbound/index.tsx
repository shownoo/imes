import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@apollo/client'
import { Plus, Eye, Trash2 } from 'lucide-react'
import { PageHeader, DataTable, Badge, Button, Card, CardContent } from 'components/common'
import { StatusBadge } from 'components/status-badge'
import { StatusFilterBar } from 'components/status-filter-bar'
import { INBOUND_STATUS_FILTERS } from 'lib/order-status'
import { INBOUND_TYPE_LABELS, formatDate } from 'lib/utils'
import { GET_INBOUND, DEL } from './queries'

export default function InboundIndex() {
  const navigate = useNavigate()
  const [statusFilter, setStatusFilter] = useState('all')

  const refetchOpts = { refetchQueries: ['GetInboundOrders'] }
  const { data, loading } = useQuery(GET_INBOUND, {
    variables: { type: 'PURCHASE', status: statusFilter === 'all' ? undefined : statusFilter, input: { take: 50 } },
  })
  const [delOrder] = useMutation(DEL, refetchOpts)

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
        desc="选单清点 → 补充效期 → 蓝牙赋码 → 扫码上架"
        action={<Button onClick={() => navigate('/inbound/create')}><Plus className="size-4" /> 新建采购入库单</Button>}
      />

      <Card className="leader-panel-card mb-6">
        <CardContent className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-5 text-sm">
          {['选单清点', '补充批次效期', '蓝牙批量赋码', '扫码上架绑定'].map((step, i) => (
            <span key={step} className="flex items-center gap-2 text-muted-foreground">
              {i > 0 && <span className="text-border">→</span>}
              <span className="flex size-5 items-center justify-center rounded-full bg-muted text-[10px] font-semibold tabular-nums">
                {i + 1}
              </span>
              {step}
            </span>
          ))}
        </CardContent>
      </Card>

      <StatusFilterBar
        className="mb-5"
        value={statusFilter}
        options={INBOUND_STATUS_FILTERS}
        onChange={setStatusFilter}
        counts={statusFilter === 'all' ? statusCounts : undefined}
      />

      <DataTable
        loading={loading}
        columns={[
          {
            key: 'orderNo',
            title: '采购单号',
            render: (r) => (
              <span className="font-medium tabular-nums tracking-tight">{String(r.orderNo)}</span>
            ),
          },
          { key: 'type', title: '类型', render: () => <Badge variant="info">{INBOUND_TYPE_LABELS.PURCHASE}</Badge> },
          {
            key: 'status',
            title: '状态',
            render: (r) => <StatusBadge status={String(r.status)} compact />,
          },
          { key: 'supplier', title: '供应商', render: (r) => (r.supplier as { name?: string })?.name ?? '—' },
          { key: 'contractNo', title: '合同号', render: (r) => String(r.contractNo ?? '—') },
          { key: 'lines', title: '明细', render: (r) => `${(r.lines as unknown[])?.length ?? 0} 项` },
          { key: 'createdAt', title: '创建时间', render: (r) => formatDate(String(r.createdAt)) },
          {
            key: 'action',
            title: '操作',
            render: (r) => (
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" className="h-7" onClick={() => navigate(`/inbound/${r.id}`)}>
                  <Eye className="size-3" /> 详情
                </Button>
                {r.status === 'DRAFT' && (
                  <Button variant="ghost" size="sm" className="h-7 text-destructive" onClick={async () => { if (confirm('确认删除？')) await delOrder({ variables: { input: { id: r.id } } }) }}>
                    <Trash2 className="size-3" />
                  </Button>
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
