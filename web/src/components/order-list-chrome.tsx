import type { ReactNode } from 'react'
import { useCallback, useState } from 'react'
import { FilterBarRow } from 'components/segment-filter-bar'
import { DebounceInput } from 'components/debounce-input'
import { ListFilterField, ListFilterToolbar } from 'components/list-filter-toolbar'
import { RangePicker } from 'components/range-picker'
import { listFilterInputClass } from 'lib/list-index-chrome'

/** GraphQL 日期段参数（与入库/出库 API 一致） */
export function orderDateQueryVars(dateFrom?: string, dateTo?: string) {
  return {
    dateFrom: dateFrom ? new Date(`${dateFrom}T00:00:00`).toISOString() : undefined,
    dateTo: dateTo ? new Date(`${dateTo}T00:00:00`).toISOString() : undefined,
  }
}

export function useOrderDateFilter() {
  const [dateFrom, setDateFrom] = useState<string | undefined>()
  const [dateTo, setDateTo] = useState<string | undefined>()

  const onDateRangeChange = useCallback((dates: [string, string] | null) => {
    if (dates) {
      setDateFrom(dates[0])
      setDateTo(dates[1])
      return
    }
    setDateFrom(undefined)
    setDateTo(undefined)
  }, [])

  return {
    onDateRangeChange,
    ...orderDateQueryVars(dateFrom, dateTo),
  }
}

export function OrderListFilterToolbar({
  children,
  trailing,
}: {
  children: ReactNode
  trailing?: ReactNode
}) {
  return (
    <ListFilterToolbar className="mb-2" trailing={trailing}>
      {children}
    </ListFilterToolbar>
  )
}

export function OrderNoFilterField({ onSearch }: { onSearch: (value: string) => void }) {
  return (
    <ListFilterField variant="oddNbr">
      <DebounceInput
        placeholder="单号"
        className={listFilterInputClass}
        debounceTime={500}
        onSearch={onSearch}
      />
    </ListFilterField>
  )
}

export function OrderDateFilterField({
  onChange,
  placeholder = '创建日期',
}: {
  onChange: (dates: [string, string] | null) => void
  placeholder?: string
}) {
  return (
    <ListFilterField variant="date">
      <RangePicker placeholder={placeholder} onChange={onChange} />
    </ListFilterField>
  )
}

/** 状态 Tab + 右侧附加筛选（如仓库） */
export function OrderListStatusRow({
  children,
  trailing,
  className,
}: {
  children: ReactNode
  trailing?: ReactNode
  className?: string
}) {
  return (
    <FilterBarRow trailing={trailing} className={className}>
      {children}
    </FilterBarRow>
  )
}
