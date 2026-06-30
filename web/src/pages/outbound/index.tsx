import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@apollo/client'
import { Eye, Trash2, Pencil } from 'lucide-react'
import { PageHeader, DataTable, Button, PageCreateButton } from 'components/common'
import { StatusBadge } from 'components/status-badge'
import { StatusFilterBar } from 'components/status-filter-bar'
import { Tooltip, TooltipContent, TooltipTrigger } from 'components/ui/tooltip'
import { OUTBOUND_STATUS_FILTERS } from 'lib/order-status'
import { formatDate } from 'lib/utils'
import { GET_OUTBOUND, DEL } from './queries'

const OUTBOUND_TITLE_TIP = '申请 → 审核 → FIFO拣货 → 拆零确认 → 出库完成'

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
        titleTip={OUTBOUND_TITLE_TIP}
        action={<PageCreateButton label="新建" onClick={() => navigate('/outbound/create')} />}
      />

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
            tip: '系统自动生成的出库单编号',
          },
          {
            key: 'status',
            title: '状态',
            tip: '当前所处流程节点',
            render: (r) => <StatusBadge status={String(r.status)} compact />,
          },
          { key: 'purpose', title: '用途', tip: '调拨或发放用途说明', render: (r) => String(r.purpose ?? '—') },
          { key: 'destination', title: '目的地', tip: '物资接收区域或单位', render: (r) => String(r.destination ?? '—') },
          { key: 'recipient', title: '领用人', tip: '实际领取人或接收方联系人', render: (r) => String(r.recipient ?? '—') },
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
      />
    </div>
  )
}
