import type { ColumnDef } from '@tanstack/react-table'
import { InfoTip } from 'components/info-tip'
import { isCodeColumn, TableCodeCell } from 'components/grid-table'

type RowRecord = Record<string, unknown>

export type DataTableColumn = {
  key: string
  title: string
  tip?: string
  /** code：编码/单号列，使用 Apple 数字字体栈 */
  cell?: 'code' | 'text' | 'default'
  render?: (row: RowRecord) => React.ReactNode
}

const DEFAULT_WIDTHS: Record<string, number> = {
  orderNo: 160,
  type: 100,
  status: 100,
  warehouse: 120,
  supplier: 180,
  contractNo: 140,
  lines: 80,
  createdAt: 110,
  action: 88,
  name: 160,
  code: 120,
  unit: 72,
  category: 120,
  minStock: 96,
  maxStock: 96,
  phone: 120,
  address: 180,
  module: 100,
  username: 120,
  role: 100,
  active: 80,
}

function renderDataCell(col: DataTableColumn, row: RowRecord) {
  if (col.render) return col.render(row)
  const value = row[col.key]
  if (isCodeColumn(col)) return <TableCodeCell>{value as string}</TableCodeCell>
  if (value == null || value === '') return null
  return String(value)
}

export function toImesColumnDef(col: DataTableColumn): ColumnDef<RowRecord> {
  const isActionCol = col.key === 'action' || col.key === 'actions' || col.key === 'link'

  return {
    id: col.key,
    accessorKey: col.key,
    header: () => (
      <span className="inline-flex items-center gap-1">
        {col.title}
        {col.tip ? (
          <InfoTip side="bottom" className="opacity-0 transition-opacity group-hover/th:opacity-100">
            {col.tip}
          </InfoTip>
        ) : null}
      </span>
    ),
    cell: ({ row }) => renderDataCell(col, row.original),
    size: DEFAULT_WIDTHS[col.key] ?? 120,
    enableSorting: false,
    enableHiding: !isActionCol,
    enableResizing: !isActionCol,
    meta: {
      label: col.title,
      fixed: isActionCol ? 'right' : undefined,
    },
  }
}

export function toImesColumns(cols: DataTableColumn[]): ColumnDef<RowRecord>[] {
  return cols.map(toImesColumnDef)
}
