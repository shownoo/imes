import { Pencil, Trash2 } from 'lucide-react'
import { Badge } from 'components/ui/badge'
import { Button } from 'components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from 'components/ui/card'
import { Skeleton } from 'components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from 'components/ui/table'
import {
  gridTableCellClass,
  gridTableHeadClass,
  gridTableRowClass,
  imesDataTableClass,
  isCodeColumn,
  TableCodeCell,
} from 'components/grid-table'
import { InfoTip } from 'components/info-tip'
import { LeaderPageHeader } from 'components/leader-page-header'
import { LeaderSurfaceCard } from 'components/leader-surface-card'
import { Tooltip, TooltipContent, TooltipTrigger } from 'components/ui/tooltip'
import { cn, formatNumber } from 'lib/utils'

export { ZoneHeatmap } from 'components/zone-heatmap'

export function PageHeader({ title, desc, titleTip, action }: { title: string; desc?: string; titleTip?: string; action?: React.ReactNode }) {
  return <LeaderPageHeader title={title} desc={desc} titleTip={titleTip} action={action} />
}

export type DataTableColumn = {
  key: string
  title: string
  tip?: string
  /** code：编码/单号列，使用 Apple 数字字体栈 */
  cell?: 'code' | 'text' | 'default'
  render?: (row: Record<string, unknown>) => React.ReactNode
}

function renderDataCell(col: DataTableColumn, row: Record<string, unknown>) {
  if (col.render) return col.render(row)
  const value = row[col.key]
  if (isCodeColumn(col)) return <TableCodeCell>{value as string}</TableCodeCell>
  if (value == null || value === '') return null
  return String(value)
}

export function DataTable({ columns, rows, loading }: {
  columns: DataTableColumn[]
  rows: Record<string, unknown>[]
  loading?: boolean
}) {
  if (loading) {
    return (
      <LeaderSurfaceCard flat contentClassName="space-y-3 p-6">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </LeaderSurfaceCard>
    )
  }

  return (
    <LeaderSurfaceCard flat contentClassName="overflow-hidden p-0">
      <Table className={imesDataTableClass}>
        <TableHeader>
          <TableRow className="border-b border-border/30 bg-transparent hover:bg-transparent">
            {columns.map((c) => (
              <TableHead key={c.key} className={gridTableHeadClass} title={c.tip}>
                <span className="inline-flex items-center gap-1">
                  {c.title}
                  {c.tip && (
                    <InfoTip side="bottom" className="opacity-0 transition-opacity group-hover/th:opacity-100">
                      {c.tip}
                    </InfoTip>
                  )}
                </span>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow className="border-0 hover:bg-transparent">
              <TableCell colSpan={columns.length} className={`${gridTableCellClass} h-28 text-center text-muted-foreground`}>
                暂无数据
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row, i) => (
              <TableRow key={String(row.id ?? i)} className={gridTableRowClass}>
                {columns.map((c) => (
                  <TableCell key={c.key} className={gridTableCellClass}>
                    {renderDataCell(c, row)}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </LeaderSurfaceCard>
  )
}

export function RowActions({ onEdit, onDelete }: { onEdit?: () => void; onDelete?: () => void }) {
  return (
    <div className="flex items-center gap-0.5">
      {onEdit && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="size-7 text-muted-foreground hover:bg-muted/50 hover:text-foreground" onClick={onEdit}>
              <Pencil className="size-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>编辑</TooltipContent>
        </Tooltip>
      )}
      {onDelete && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="size-7 text-muted-foreground hover:bg-muted/50 hover:text-destructive" onClick={onDelete}>
              <Trash2 className="size-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>删除</TooltipContent>
        </Tooltip>
      )}
    </div>
  )
}

export function StatCard({ title, value, subtitle, icon, accent = 'primary' }: {
  title: string
  value: string | number
  subtitle?: string
  icon?: React.ReactNode
  accent?: 'primary' | 'gold' | 'emerald' | 'amber' | 'rose'
}) {
  return (
    <LeaderSurfaceCard className="leader-kpi-card" interactive>
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <CardTitle className="leader-kpi-label text-xs font-medium uppercase tracking-wider">{title}</CardTitle>
        {icon && (
          <span style={{ color: 'var(--leader-accent, hsl(var(--primary)))', opacity: 0.85 }}>
            {icon}
          </span>
        )}
      </CardHeader>
      <CardContent>
        <p data-leader-kpi-value className="font-number">{value}</p>
        {subtitle && <p className="leader-kpi-label mt-1">{subtitle}</p>}
      </CardContent>
    </LeaderSurfaceCard>
  )
}

export function ExpiryBar({ green, yellow, red }: { green: number; yellow: number; red: number }) {
  const total = green + yellow + red || 1
  return (
    <div className="space-y-3">
      <div className="flex h-3 overflow-hidden rounded-full">
        <div className="bg-emerald-500" style={{ width: `${(green / total) * 100}%` }} />
        <div className="bg-amber-400" style={{ width: `${(yellow / total) * 100}%` }} />
        <div className="bg-red-500" style={{ width: `${(red / total) * 100}%` }} />
      </div>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>安全 {formatNumber(green)}</span>
        <span>临期 {formatNumber(yellow)}</span>
        <span>预警 {formatNumber(red)}</span>
      </div>
    </div>
  )
}

export function StockWaterLevel({ items }: { items: Array<{ material: { name: string; unit: string }; quantity: number; min: number; max: number; status: string; pct: number }> }) {
  const statusColor = { LOW: 'bg-red-500', HIGH: 'bg-amber-400', NORMAL: 'bg-emerald-500' }
  const statusLabel = { LOW: '低库存', HIGH: '高库存', NORMAL: '正常' }
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.material.name} className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="font-medium">{item.material.name}</span>
            <span className="text-muted-foreground">
              {formatNumber(item.quantity)} {item.material.unit}
              <span className={`ml-2 inline-block size-2 rounded-full ${statusColor[item.status as keyof typeof statusColor] ?? 'bg-muted'}`} />
              {statusLabel[item.status as keyof typeof statusLabel] ?? item.status}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className={`h-full rounded-full ${statusColor[item.status as keyof typeof statusColor] ?? 'bg-primary'}`}
              style={{ width: `${Math.min(item.pct, 100)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

export function ExpiryHealthPanel({ health }: { health: { green: number; yellow: number; red: number; greenPct: number; yellowPct: number; redPct: number; healthScore: number } }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-center">
          <p data-leader-kpi-value style={{ color: 'var(--leader-accent)' }}>{health.healthScore}%</p>
          <p className="text-xs text-muted-foreground">效期健康度</p>
        </div>
        <div className="flex gap-4 text-center text-xs">
          <div><span className="block size-3 rounded-full bg-emerald-500 mx-auto mb-1" />安全 {health.greenPct}%</div>
          <div><span className="block size-3 rounded-full bg-amber-400 mx-auto mb-1" />临期 {health.yellowPct}%</div>
          <div><span className="block size-3 rounded-full bg-red-500 mx-auto mb-1" />预警 {health.redPct}%</div>
        </div>
      </div>
      <ExpiryBar green={health.green} yellow={health.yellow} red={health.red} />
    </div>
  )
}

export { TableCodeCell } from 'components/grid-table'
export { PageActionButton, PageCreateButton, ToolbarButton } from 'components/app-button'
export { FormProcessButtons } from 'components/form-process-buttons'
export { Badge, Button, Card, CardContent, CardHeader, CardTitle }
