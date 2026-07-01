import * as React from 'react'
import {
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'

import {
  gridTableCellClass,
  gridTableHeadClass,
  gridTableRowClass,
  imesDataTableClass,
} from 'components/grid-table'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from 'components/ui/table'
import { cn } from 'lib/utils'

import { type ColumnFixedMeta, type ColumnOrderMeta } from './columnOrderStorage'
import { COLUMN_SIZE_MAX, COLUMN_SIZE_MIN } from './columnSizingStorage'
import { DataTableColumnSettings } from './data-table-toolbar'
import { DataTablePagination, type DataTablePaginationProps } from './data-table-pagination'
import { usePersistedTableColumns } from './usePersistedTableColumns'

export interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  isLoading?: boolean
  showColumnToggle?: boolean
  defaultColumnVisibility?: VisibilityState
  columnVisibility?: VisibilityState
  getRowId?: (row: TData, index: number) => string
  onRowClick?: (row: TData, index: number) => void
  rowClassName?: (row: TData, index: number) => string
  showHeader?: boolean
  className?: string
  tableContainerClassName?: string
  emptyContent?: React.ReactNode
  tableKey?: string
  enableColumnResize?: boolean
  enableColumnReorder?: boolean
  /** 服务端分页；传入时在表格底栏展示分页与列设置 */
  pagination?: Omit<DataTablePaginationProps, 'actionsBeforeRefresh' | 'className'> & {
    page: number
    onPageChange: (page: number) => void
    onPageSizeChange: (pageSize: number) => void
  }
}

type ColumnMeta = {
  align?: string
  className?: string
  width?: number | string
  fixed?: ColumnFixedMeta
  ellipsis?: boolean
}

function useColumnOrderConfig<TData, TValue>(columns: ColumnDef<TData, TValue>[]) {
  return React.useMemo(() => {
    const columnMetas: ColumnOrderMeta[] = []

    const visit = (cols: ColumnDef<TData, TValue>[]) => {
      for (const col of cols) {
        const nested = (col as { columns?: ColumnDef<TData, TValue>[] }).columns
        if (nested?.length) {
          visit(nested)
          continue
        }
        const accessorKey = (col as { accessorKey?: unknown }).accessorKey
        const id = col.id ?? (typeof accessorKey === 'string' ? accessorKey : undefined)
        if (!id) continue

        const meta = col.meta as { fixed?: ColumnFixedMeta } | undefined
        columnMetas.push({ id, fixed: meta?.fixed })
      }
    }

    visit(columns)
    const defaultOrder = columnMetas.map((m) => m.id)
    return { columnMetas, defaultOrder }
  }, [columns])
}

function useColumnResizeConfig<TData, TValue>(
  columns: ColumnDef<TData, TValue>[],
  columnResizeEnabled: boolean,
) {
  return React.useMemo(() => {
    const defaultSizes: Record<string, number> = {}
    const resizableColumnIds: string[] = []

    const visit = (cols: ColumnDef<TData, TValue>[]) => {
      for (const col of cols) {
        const nested = (col as { columns?: ColumnDef<TData, TValue>[] }).columns
        if (nested?.length) {
          visit(nested)
          continue
        }
        const accessorKey = (col as { accessorKey?: unknown }).accessorKey
        const id = col.id ?? (typeof accessorKey === 'string' ? accessorKey : undefined)
        if (!id) continue

        if (typeof col.size === 'number') {
          defaultSizes[id] = col.size
        }

        if (!columnResizeEnabled) continue
        if (col.enableResizing === false) continue

        const meta = col.meta as ColumnMeta | undefined
        if (
          meta?.fixed === 'left' ||
          meta?.fixed === 'right' ||
          meta?.fixed === true
        ) {
          continue
        }
        if (id === '_selection') continue

        resizableColumnIds.push(id)
      }
    }

    visit(columns)
    return { defaultSizes, resizableColumnIds }
  }, [columns, columnResizeEnabled])
}

function columnWidthStyle(
  size: number | undefined,
  minSize?: number,
): React.CSSProperties {
  if (!size) return {}
  const floor = minSize ?? size
  return {
    width: `${size}px`,
    maxWidth: `${size}px`,
    minWidth: `${floor}px`,
  }
}

export function DataTable<TData, TValue>({
  columns,
  data,
  isLoading = false,
  showColumnToggle = false,
  defaultColumnVisibility,
  columnVisibility: externalColumnVisibility,
  getRowId,
  onRowClick,
  rowClassName,
  showHeader = true,
  className,
  tableContainerClassName,
  emptyContent,
  tableKey,
  enableColumnResize,
  enableColumnReorder,
  pagination,
}: DataTableProps<TData, TValue>) {
  const columnResizeEnabled = enableColumnResize ?? Boolean(tableKey)
  const columnReorderEnabled = enableColumnReorder ?? Boolean(tableKey)
  const showColumnsPanel = showColumnToggle || columnReorderEnabled
  const { defaultSizes, resizableColumnIds } = useColumnResizeConfig(
    columns,
    columnResizeEnabled,
  )
  const { columnMetas, defaultOrder } = useColumnOrderConfig(columns)
  const visibilityPersistEnabled =
    showColumnsPanel && externalColumnVisibility === undefined
  const {
    columnSizing,
    onColumnSizingChange,
    resetColumnSize,
    columnOrder,
    onColumnOrderChange,
    columnVisibility: persistedColumnVisibility,
    onColumnVisibilityChange,
    resetColumnSettings,
  } = usePersistedTableColumns({
    tableKey,
    defaultOrder,
    columnMetas,
    defaultVisibility: defaultColumnVisibility ?? {},
    columnIds: defaultOrder,
    defaultSizes,
    resizableColumnIds,
    orderEnabled: columnReorderEnabled,
    visibilityEnabled: visibilityPersistEnabled,
    sizingEnabled: columnResizeEnabled,
  })
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])

  const columnVisibility = externalColumnVisibility ?? persistedColumnVisibility

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: externalColumnVisibility
      ? undefined
      : onColumnVisibilityChange,
    onColumnOrderChange: columnReorderEnabled ? onColumnOrderChange : undefined,
    enableColumnResizing: columnResizeEnabled,
    columnResizeMode: 'onChange',
    onColumnSizingChange: columnResizeEnabled ? onColumnSizingChange : undefined,
    defaultColumn: {
      minSize: COLUMN_SIZE_MIN,
      maxSize: COLUMN_SIZE_MAX,
    },
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      ...(columnReorderEnabled ? { columnOrder } : {}),
      ...(columnResizeEnabled ? { columnSizing } : {}),
      pagination: {
        pageIndex: 0,
        pageSize: data.length || 10,
      },
    },
    manualPagination: true,
    getRowId: getRowId ? (row, index) => getRowId(row, index) : undefined,
  })

  if (isLoading) {
    return (
      <div className={cn('flex items-center justify-center py-12', className)}>
        <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  const columnSettingsFooter =
    showColumnsPanel ? (
      <DataTableColumnSettings
        table={table}
        showColumnToggle={showColumnToggle || columnReorderEnabled}
        enableColumnReorder={columnReorderEnabled}
        columnMetas={columnMetas}
        columnOrder={columnOrder}
        onColumnOrderChange={(order) => onColumnOrderChange(order)}
        onResetColumnSettings={resetColumnSettings}
        placement="footer"
      />
    ) : null

  const showTableFooter = Boolean(pagination || columnSettingsFooter)

  return (
    <div className={cn('data-table-root w-full min-w-0', className)}>
      <Table
        className={cn(imesDataTableClass, 'table-fixed')}
        containerClassName={cn('overflow-hidden', tableContainerClassName)}
      >
        <colgroup>
          {table.getVisibleLeafColumns().map((col) => {
            const width = columnResizeEnabled ? col.getSize() : col.columnDef.size
            return (
              <col key={col.id} style={width ? { width: `${width}px` } : undefined} />
            )
          })}
        </colgroup>
        {showHeader ? (
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow
                key={headerGroup.id}
                className="border-b border-border/30 bg-transparent hover:bg-transparent"
              >
                {headerGroup.headers.map((header) => {
                  const meta = header.column.columnDef.meta as ColumnMeta | undefined
                  const colSize = columnResizeEnabled
                    ? header.getSize()
                    : header.column.columnDef.size
                  const colMinSize = header.column.columnDef.minSize
                  const canResize = columnResizeEnabled && header.column.getCanResize()
                  return (
                    <TableHead
                      key={header.id}
                      style={
                        colSize
                          ? columnWidthStyle(colSize, colMinSize)
                          : { width: meta?.width ?? 'auto' }
                      }
                      className={cn('group/th relative', gridTableHeadClass, meta?.className)}
                    >
                      <div
                        className={cn(
                          'flex min-w-0 items-center gap-1 overflow-hidden',
                          meta?.align === 'right' && 'justify-end',
                          meta?.align === 'center' && 'justify-center',
                        )}
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(header.column.columnDef.header, header.getContext())}
                      </div>
                      {canResize ? (
                        <div
                          role="separator"
                          aria-orientation="vertical"
                          aria-label="调整列宽"
                          onMouseDown={header.getResizeHandler()}
                          onTouchStart={header.getResizeHandler()}
                          onDoubleClick={(e) => {
                            e.stopPropagation()
                            resetColumnSize(header.column.id)
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className={cn(
                            'absolute right-0 top-0 z-[3] h-full w-1.5 -mr-0.5 cursor-col-resize touch-none select-none',
                            'hover:bg-primary/25 active:bg-primary/35',
                            header.column.getIsResizing() && 'bg-primary/35',
                          )}
                        />
                      ) : null}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
        ) : null}
        <TableBody>
          {table.getRowModel().rows.length === 0 ? (
            <TableRow className="border-0 hover:bg-transparent">
              <TableCell
                colSpan={columns.length}
                className={cn(gridTableCellClass, 'h-28 text-center text-muted-foreground')}
              >
                {emptyContent ?? '暂无数据'}
              </TableCell>
            </TableRow>
          ) : (
            table.getRowModel().rows.map((row) => {
              const record = row.original
              const rowIdx = row.index

              return (
                <TableRow
                  key={row.id}
                  className={cn(
                    gridTableRowClass,
                    onRowClick && 'cursor-pointer',
                    rowClassName?.(record, rowIdx),
                  )}
                  onClick={(e) => {
                    if ((e.target as HTMLElement).closest('button,a,[role="menuitem"]')) return
                    onRowClick?.(record, rowIdx)
                  }}
                >
                  {row.getVisibleCells().map((cell) => {
                    const meta = cell.column.columnDef.meta as ColumnMeta | undefined
                    const colSize = columnResizeEnabled
                      ? cell.column.getSize()
                      : cell.column.columnDef.size
                    const colMinSize = cell.column.columnDef.minSize
                    return (
                      <TableCell
                        key={cell.id}
                        style={colSize ? columnWidthStyle(colSize, colMinSize) : undefined}
                        className={cn(
                          gridTableCellClass,
                          meta?.ellipsis && 'max-w-[200px] truncate overflow-hidden text-ellipsis',
                          meta?.className,
                        )}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    )
                  })}
                </TableRow>
              )
            })
          )}
        </TableBody>
      </Table>

      {showTableFooter ? (
        pagination ? (
          <DataTablePagination
            current={pagination.page}
            pageSize={pagination.pageSize}
            total={pagination.total}
            disabled={pagination.disabled}
            onChange={(nextPage) => pagination.onPageChange(nextPage)}
            onShowSizeChange={(_, size) => pagination.onPageSizeChange(size)}
            handleRefresh={pagination.handleRefresh}
            actionsBeforeRefresh={columnSettingsFooter}
          />
        ) : (
          <div className="flex items-center justify-end border-t border-border/35 px-3 py-2">
            {columnSettingsFooter}
          </div>
        )
      ) : null}
    </div>
  )
}
