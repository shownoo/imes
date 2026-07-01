import { useEffect, useMemo, useState } from 'react'
import { gql, useQuery } from '@apollo/client'
import { Search } from 'lucide-react'
import { LeaderSurfaceCard } from 'components/leader-surface-card'
import { DataTablePagination } from 'components/data-table/data-table-pagination'
import { FilterBarRow } from 'components/segment-filter-bar'
import { MovementFilterBar } from 'components/movement-filter-bar'
import { DebounceInput } from 'components/debounce-input'
import { SearchInputShell } from 'components/section-menu'
import { MOVEMENT_TYPE_FILTERS } from 'lib/movement-types'
import { listFilterInputClass } from 'lib/list-index-chrome'
import { cn } from 'lib/utils'
import { MovementsTable } from './movements-table'
import { useTranslation } from 'react-i18next'

const GET_MOVEMENTS = gql`
  query GetMovements($type: String, $input: PaginationInput) {
    getMovements(type: $type, input: $input)
  }
`

export function MovementsSection() {
  const { t } = useTranslation()
  const [typeFilter, setTypeFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)

  const { data, loading, refetch } = useQuery(GET_MOVEMENTS, {
    variables: {
      type: typeFilter === 'all' ? undefined : typeFilter,
      input: {
        take: pageSize,
        skip: (page - 1) * pageSize,
        search: search || undefined,
      },
    },
  })

  const payload = data?.getMovements as { movements: Array<Record<string, unknown>>; count: number } | undefined
  const movements = payload?.movements ?? []
  const total = payload?.count ?? 0

  useEffect(() => {
    setPage(1)
  }, [typeFilter, search])

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
    <div className="space-y-3">
      <SearchInputShell>
        <Search className="pointer-events-none absolute left-3.5 top-1/2 z-10 size-4 -translate-y-1/2 text-muted-foreground" />
        <DebounceInput
          key="movements-search"
          className={cn(listFilterInputClass, 'pl-9')}
          placeholder={t('搜索物资、二维码、操作人、备注...')}
          defaultValue={search}
          debounceTime={500}
          onSearch={setSearch}
        />
      </SearchInputShell>

      <FilterBarRow>
        <MovementFilterBar
          value={typeFilter}
          options={MOVEMENT_TYPE_FILTERS}
          onChange={setTypeFilter}
          counts={typeCounts}
        />
      </FilterBarRow>

      <LeaderSurfaceCard flat contentClassName="overflow-hidden p-0">
        <MovementsTable rows={movements} loading={loading} />
        <DataTablePagination
          current={page}
          pageSize={pageSize}
          total={total}
          disabled={loading}
          onChange={(nextPage) => setPage(nextPage)}
          onShowSizeChange={(_, size) => {
            setPageSize(size)
            setPage(1)
          }}
          handleRefresh={() => void refetch()}
        />
      </LeaderSurfaceCard>
    </div>
  )
}
