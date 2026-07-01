import { useMemo } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import { Badge } from 'components/ui/badge'
import { Button } from 'components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from 'components/ui/card'
import { Skeleton } from 'components/ui/skeleton'
import { LeaderPageHeader } from 'components/leader-page-header'
import { LeaderSurfaceCard } from 'components/leader-surface-card'
import { Tooltip, TooltipContent, TooltipTrigger } from 'components/ui/tooltip'
import { cn, formatNumber } from 'lib/utils'
import {
  DataTable as TanStackDataTable,
  type DataTableColumn,
  toImesColumns,
} from 'components/data-table'

export { type DataTableColumn } from 'components/data-table'
export { TABLE_KEYS } from 'components/data-table'

export { ZoneHeatmap } from 'components/zone-heatmap'
export {
  DashboardChartExpiryPie,
  DashboardChartAlertPie,
  DashboardChartZoneBar,
  DashboardChartCategoryBar,
  DashboardChartInboundBar,
  DashboardChartOutboundBar,
  DashboardChartDestinationBar,
  DashboardChartIoTrend,
  type DashboardChartsData,
} from 'components/dashboard-stats-charts'

export function PageHeader({ title, desc, titleTip, action }: { title: string; desc?: string; titleTip?: string; action?: React.ReactNode }) {
  return <LeaderPageHeader title={title} desc={desc} titleTip={titleTip} action={action} />
}

export function DataTable({
  columns,
  rows,
  loading,
  tableKey,
  total,
  page = 1,
  pageSize = 20,
  onPageChange,
  onPageSizeChange,
  onRefresh,
}: {
  columns: DataTableColumn[]
  rows: Record<string, unknown>[]
  loading?: boolean
  /** 设置后启用列宽拖拽、列顺序/显示自定义，并持久化到 localStorage */
  tableKey?: string
  total?: number
  page?: number
  pageSize?: number
  onPageChange?: (page: number) => void
  onPageSizeChange?: (pageSize: number) => void
  onRefresh?: () => void
}) {
  const tanStackColumns = useMemo(() => toImesColumns(columns), [columns])
  const paginationEnabled = total != null && onPageChange != null && onPageSizeChange != null

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
      <TanStackDataTable
        columns={tanStackColumns}
        data={rows}
        tableKey={tableKey}
        enableColumnResize={Boolean(tableKey)}
        enableColumnReorder={Boolean(tableKey)}
        showColumnToggle={Boolean(tableKey)}
        getRowId={(row, index) => String(row.id ?? index)}
        pagination={
          paginationEnabled
            ? {
                page,
                pageSize,
                total,
                onPageChange,
                onPageSizeChange,
                handleRefresh: onRefresh,
              }
            : undefined
        }
      />
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
          <TooltipContent>{'编辑'}</TooltipContent>
        </Tooltip>
      )}
      {onDelete && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="size-7 text-muted-foreground hover:bg-muted/50 hover:text-destructive" onClick={onDelete}>
              <Trash2 className="size-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{'删除'}</TooltipContent>
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
          <p className="text-xs text-muted-foreground">{'效期健康度'}</p>
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
