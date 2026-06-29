import { useMemo, useState } from 'react'
import { gql, useQuery } from '@apollo/client'
import { useNavigate } from 'react-router-dom'
import { Search } from 'lucide-react'
import { DataTable } from 'components/common'
import { MovementTypeBadge } from 'components/movement-type-badge'
import { MovementFilterBar } from 'components/movement-filter-bar'
import { DebounceInput } from 'components/debounce-input'
import { MOVEMENT_TYPE_FILTERS, formatQtyChange } from 'lib/movement-types'
import { formatDateTime } from 'lib/utils'

const GET_MOVEMENTS = gql`
  query GetMovements($type: String, $input: PaginationInput) {
    getMovements(type: $type, input: $input)
  }
`

const REF_TYPE_LABELS: Record<string, string> = {
  InboundOrder: '采购入库',
  OutboundOrder: '出库单',
}

export function MovementsSection() {
  const navigate = useNavigate()
  const [typeFilter, setTypeFilter] = useState('all')
  const [search, setSearch] = useState('')

  const { data, loading } = useQuery(GET_MOVEMENTS, {
    variables: {
      type: typeFilter === 'all' ? undefined : typeFilter,
      input: { take: 100, search: search || undefined },
    },
  })

  const payload = data?.getMovements as { movements: Array<Record<string, unknown>>; count: number } | undefined
  const movements = payload?.movements ?? []
  const total = payload?.count ?? 0

  const typeCounts = useMemo(() => {
    if (typeFilter !== 'all') return undefined
    const counts: Record<string, number> = { all: total }
    for (const m of movements) {
      const t = String(m.type)
      counts[t] = (counts[t] ?? 0) + 1
    }
    return counts
  }, [movements, total, typeFilter])

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">'全链路库存变动 · 共'<span className="font-medium tabular-nums text-foreground">{total}</span> 条
          {movements.length < total && ` · 当前显示 ${movements.length} 条`}
        </p>
        <div className="relative max-w-xs flex-1 sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 z-10 size-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <DebounceInput
            key="movements-search"
            className="pl-9"
            placeholder='搜索物资、二维码、操作人、备注...'
            defaultValue={search}
            debounceTime={500}
            onSearch={setSearch}
          />
        </div>
      </div>

      <MovementFilterBar
        value={typeFilter}
        options={MOVEMENT_TYPE_FILTERS}
        onChange={setTypeFilter}
        counts={typeCounts}
      />

      <DataTable
        loading={loading}
        columns={[
          {
            key: 'createdAt',
            title: '时间',
            render: (r) => (
              <span className="whitespace-nowrap text-xs tabular-nums text-muted-foreground">
                {formatDateTime(String(r.createdAt))}
              </span>
            ),
          },
          {
            key: 'type',
            title: '类型',
            render: (r) => <MovementTypeBadge type={String(r.type)} />,
          },
          {
            key: 'material',
            title: '物资',
            render: (r) => {
              const material = (r.stockItem as { material?: { name?: string; code?: string } })?.material
              return (
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{material?.name ?? '—'}</p>
                  <p className="truncate text-[11px] text-muted-foreground">{material?.code}</p>
                </div>
              )
            },
          },
          {
            key: 'qrCode',
            title: '二维码',
            render: (r) => {
              const qr = String((r.stockItem as { qrCode?: string })?.qrCode ?? '')
              return (
                <button
                  type="button"
                  className="max-w-[8rem] truncate font-mono text-[11px] text-primary hover:underline"
                  title={qr}
                  onClick={() => navigate(`/trace?qr=${encodeURIComponent(qr)}`)}
                >
                  {qr || '—'}
                </button>
              )
            },
          },
          {
            key: 'quantity',
            title: '数量变化',
            render: (r) => (
              <span className="tabular-nums text-sm">
                {formatQtyChange(r.beforeQty, r.afterQty, r.quantity)}
              </span>
            ),
          },
          {
            key: 'operator',
            title: '操作人',
            render: (r) => String((r.operator as { name?: string })?.name ?? '—'),
          },
          {
            key: 'ref',
            title: '关联',
            render: (r) => {
              const refType = r.refType ? REF_TYPE_LABELS[String(r.refType)] ?? String(r.refType) : null
              if (!refType) return <span className="text-muted-foreground">—</span>
              return <span className="text-xs text-muted-foreground">{refType}</span>
            },
          },
          {
            key: 'note',
            title: '备注',
            render: (r) => (
              <span className="line-clamp-2 max-w-[14rem] text-xs text-muted-foreground" title={String(r.note ?? '')}>
                {String(r.note ?? '—')}
              </span>
            ),
          },
        ]}
        rows={movements}
      />
    </div>
  )
}
