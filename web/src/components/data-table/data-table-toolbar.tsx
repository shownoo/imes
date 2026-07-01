import * as React from 'react'
import type { Table } from '@tanstack/react-table'
import { Columns3, GripVertical, Lock } from 'lucide-react'
import { Button } from 'components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from 'components/ui/popover'
import { Tooltip, TooltipContent, TooltipTrigger } from 'components/ui/tooltip'
import { cn } from 'lib/utils'
import { getColumnHeaderLabel } from './columnHeaderLabel'
import {
  type ColumnOrderMeta,
  type ColumnZone,
  getColumnZone,
  reorderMiddleColumns,
} from './columnOrderStorage'

interface DataTableToolbarProps<TData> {
  table: Table<TData>
  showColumnToggle?: boolean
  enableColumnReorder?: boolean
  columnMetas?: ColumnOrderMeta[]
  columnOrder?: string[]
  onColumnOrderChange?: (order: string[]) => void
  onResetColumnSettings?: () => void
}

interface ColumnPanelRow {
  id: string
  displayName: string
  zone: ColumnZone
  canHide: boolean
  visible: boolean
}

function buildPanelRows<TData>(
  table: Table<TData>,
  columnMetas: ColumnOrderMeta[],
  columnOrder: string[],
): ColumnPanelRow[] {
  const metaById = new Map(columnMetas.map((m) => [m.id, m]))
  const columnById = new Map(table.getAllColumns().map((c) => [c.id, c]))
  const order = columnOrder.length > 0 ? columnOrder : columnMetas.map((m) => m.id)

  return order
    .filter((id) => id !== '_selection' && columnById.has(id))
    .map((id) => {
      const column = columnById.get(id)!
      const meta = metaById.get(id)
      return {
        id,
        displayName: getColumnHeaderLabel(column, table),
        zone: getColumnZone(id, meta?.fixed),
        canHide: column.getCanHide(),
        visible: column.getIsVisible(),
      }
    })
}

function ColumnSettingsPanel<TData>({
  table,
  columnMetas,
  columnOrder,
  onColumnOrderChange,
  onResetColumnSettings,
  enableColumnReorder,
  showColumnToggle,
}: {
  table: Table<TData>
  columnMetas: ColumnOrderMeta[]
  columnOrder: string[]
  onColumnOrderChange?: (order: string[]) => void
  onResetColumnSettings?: () => void
  enableColumnReorder: boolean
  showColumnToggle: boolean
}) {
  const rows = buildPanelRows(table, columnMetas, columnOrder)
  const dragIndexRef = React.useRef<number | null>(null)

  const middleRows = rows.filter((row) => row.zone === 'middle')
  const canReorder = enableColumnReorder && middleRows.length > 0

  const handleDragStart = (middleIndex: number) => {
    dragIndexRef.current = middleIndex
  }

  const handleDrop = (middleIndex: number) => {
    const from = dragIndexRef.current
    dragIndexRef.current = null
    if (from == null || from === middleIndex || !onColumnOrderChange) return
    onColumnOrderChange(
      reorderMiddleColumns(columnOrder, from, middleIndex, columnMetas),
    )
  }

  if (rows.length === 0) return null

  return (
    <div className="w-[17rem] p-3">
      <div className="max-h-52 space-y-0.5 overflow-y-auto rounded-lg border border-border/40 bg-muted/10 p-1">
        {rows.map((row) => {
          const isDraggable = canReorder && row.zone === 'middle'
          const middleIndex = isDraggable
            ? middleRows.findIndex((r) => r.id === row.id)
            : -1

          return (
            <div
              key={row.id}
              draggable={isDraggable}
              onDragStart={() => {
                if (isDraggable) handleDragStart(middleIndex)
              }}
              onDragOver={(e) => {
                if (isDraggable) e.preventDefault()
              }}
              onDrop={(e) => {
                if (!isDraggable) return
                e.preventDefault()
                handleDrop(middleIndex)
              }}
              className={cn(
                'flex min-h-7 items-center gap-1.5 rounded-md px-1.5 py-0.5 text-xs',
                isDraggable &&
                  'cursor-grab hover:bg-muted/50 active:cursor-grabbing',
                !isDraggable && 'hover:bg-muted/30',
              )}
            >
              {isDraggable ? (
                <GripVertical
                  className="size-3.5 shrink-0 text-muted-foreground/70"
                  aria-hidden
                />
              ) : (
                <span className="size-3.5 shrink-0" aria-hidden />
              )}
              <span className="min-w-0 flex-1 truncate">{row.displayName}</span>
              {row.canHide ? (
                <input
                  type="checkbox"
                  checked={row.visible}
                  onChange={(e) => {
                    table.getColumn(row.id)?.toggleVisibility(e.target.checked)
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className="size-3.5 shrink-0 accent-primary"
                  aria-label={row.displayName}
                />
              ) : (
                <Lock className="size-3.5 shrink-0 text-muted-foreground/50" aria-hidden />
              )}
            </div>
          )
        })}
      </div>

      {(showColumnToggle || enableColumnReorder) && onResetColumnSettings ? (
        <div className="mt-2 border-t border-border/50 pt-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 w-full text-xs"
            onClick={onResetColumnSettings}
          >
            恢复默认
          </Button>
        </div>
      ) : null}
    </div>
  )
}

export function DataTableColumnSettings<TData>({
  table,
  showColumnToggle = true,
  enableColumnReorder = false,
  columnMetas = [],
  columnOrder = [],
  onColumnOrderChange,
  onResetColumnSettings,
  className,
  placement = 'toolbar',
}: Pick<
  DataTableToolbarProps<TData>,
  | 'table'
  | 'showColumnToggle'
  | 'enableColumnReorder'
  | 'columnMetas'
  | 'columnOrder'
  | 'onColumnOrderChange'
  | 'onResetColumnSettings'
> & { className?: string; placement?: 'toolbar' | 'footer' }) {
  const showColumnPanel =
    showColumnToggle || (enableColumnReorder && columnMetas.length > 0)

  if (!showColumnPanel) return null

  const inFooter = placement === 'footer'
  const popoverSide = inFooter ? 'top' : 'bottom'
  const tooltipSide = inFooter ? 'top' : 'bottom'

  return (
    <Popover>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant={inFooter ? 'outline' : 'ghost'}
              size="icon"
              className={cn(
                inFooter ? 'size-7 shrink-0' : 'size-7 shrink-0 text-muted-foreground hover:text-foreground',
                className,
              )}
              aria-label="列设置"
            >
              <Columns3 className="size-3.5" aria-hidden />
            </Button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent side={tooltipSide}>列设置</TooltipContent>
      </Tooltip>
      <PopoverContent side={popoverSide} align="end" className="w-auto p-0">
        <ColumnSettingsPanel
          table={table}
          columnMetas={columnMetas}
          columnOrder={columnOrder}
          onColumnOrderChange={onColumnOrderChange}
          onResetColumnSettings={onResetColumnSettings}
          enableColumnReorder={enableColumnReorder}
          showColumnToggle={showColumnToggle}
        />
      </PopoverContent>
    </Popover>
  )
}

export function DataTableToolbar<TData>({
  table,
  showColumnToggle = true,
  enableColumnReorder = false,
  columnMetas = [],
  columnOrder = [],
  onColumnOrderChange,
  onResetColumnSettings,
}: DataTableToolbarProps<TData>) {
  const showColumnPanel =
    showColumnToggle || (enableColumnReorder && columnMetas.length > 0)

  if (!showColumnPanel) return null

  return (
    <div className="flex items-center justify-end px-2 py-1.5">
      <DataTableColumnSettings
        table={table}
        showColumnToggle={showColumnToggle}
        enableColumnReorder={enableColumnReorder}
        columnMetas={columnMetas}
        columnOrder={columnOrder}
        onColumnOrderChange={onColumnOrderChange}
        onResetColumnSettings={onResetColumnSettings}
      />
    </div>
  )
}
