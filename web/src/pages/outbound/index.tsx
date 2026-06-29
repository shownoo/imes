import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@apollo/client'
import { Plus, Eye, Trash2, Pencil } from 'lucide-react'
import { PageHeader, DataTable, Button, Card, CardContent } from 'components/common'
import { StatusBadge } from 'components/status-badge'
import { StatusFilterBar } from 'components/status-filter-bar'
import { OUTBOUND_STATUS_FILTERS } from 'lib/order-status'
import { formatDate } from 'lib/utils'
import { GET_OUTBOUND, DEL } from './queries'

export default function OutboundIndex() {
  const navigate = useNavigate()
  const [statusFilter, setStatusFilter] = useState('all')

  const refetchOpts = { refetchQueries: ['GetOutboundOrders'] }
  const { data, loading } = useQuery(GET_OUTBOUND, {
    variables: { status: statusFilter === 'all' ? undefined : statusFilter, input: { take: 50 } },
  })
  const [delOrder] = useMutation(DEL, refetchOpts)

  const orders = (data?.getOutboundOrders as { orders: Array<Record<string, unknown>> })?.orders ?? []

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
        title="出库管理"
        desc="申请 → 审核 → FIFO拣货 → 拆零确认 → 出库完成"
        action={<Button onClick={() => navigate('/outbound/create')}><Plus className="size-4" /> 新建出库单</Button>}
      />

      <Card className="leader-panel-card mb-6">
        <CardContent className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-5 text-sm">
          {['新建申请', '主管审核', 'FIFO拣货', '拆零赋码', '确认出库'].map((step, i) => (
            <span key={step} className="flex items-center gap-2 text-muted-foreground">
              {i > 0 && <span className="text-border">→</span>}
              <span className="flex size-5 items-center justify-center rounded-full bg-muted text-[10px] font-semibold tabular-nums text-muted-foreground">
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
        options={OUTBOUND_STATUS_FILTERS}
        onChange={setStatusFilter}
        counts={statusFilter === 'all' ? statusCounts : undefined}
      />

      <DataTable
        loading={loading}
        columns={[
          {
            key: 'orderNo',
            title: '单号',
            render: (r) => (
              <span className="font-medium tabular-nums tracking-tight">{String(r.orderNo)}</span>
            ),
          },
          {
            key: 'status',
            title: '状态',
            render: (r) => <StatusBadge status={String(r.status)} compact />,
          },
          { key: 'purpose', title: '用途', render: (r) => String(r.purpose ?? '—') },
          { key: 'destination', title: '目的地', render: (r) => String(r.destination ?? '—') },
          { key: 'recipient', title: '领用人', render: (r) => String(r.recipient ?? '—') },
          { key: 'lines', title: '明细', render: (r) => `${(r.lines as unknown[])?.length ?? 0} 项` },
          { key: 'createdAt', title: '创建时间', render: (r) => formatDate(String(r.createdAt)) },
          {
            key: 'action',
            title: '操作',
            render: (r) => (
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" className="h-7" onClick={() => navigate(`/outbound/${r.id}`)}>
                  <Eye className="size-3" /> 详情
                </Button>
                {r.status === 'DRAFT' && (
                  <>
                    <Button variant="ghost" size="sm" className="h-7" onClick={() => navigate(`/outbound/${r.id}/edit`)}>
                      <Pencil className="size-3" /> 编辑
                    </Button>
                    <Button variant="ghost" size="sm" className="h-7 text-destructive" onClick={async () => { if (confirm('确认删除？')) await delOrder({ variables: { input: { id: r.id } } }) }}>
                      <Trash2 className="size-3" />
                    </Button>
                  </>
                )}
                {r.status === 'REJECTED' && (
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
