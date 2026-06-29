import { Pencil, Trash2 } from 'lucide-react'
import { Badge } from 'components/ui/badge'
import { Button } from 'components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from 'components/ui/card'
import { Skeleton } from 'components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from 'components/ui/table'
import { LeaderPageHeader } from 'components/leader-page-header'
import { LeaderSurfaceCard } from 'components/leader-surface-card'
import { cn, formatNumber } from 'lib/utils'

export { ZoneHeatmap } from 'components/zone-heatmap'

export function PageHeader({ title, desc, action }: { title: string; desc?: string; action?: React.ReactNode }) {
  return <LeaderPageHeader title={title} desc={desc} action={action} />
}

export function DataTable({ columns, rows, loading }: {
  columns: { key: string; title: string; render?: (row: Record<string, unknown>) => React.ReactNode }[]
  rows: Record<string, unknown>[]
  loading?: boolean
}) {
  if (loading) {
    return (
      <LeaderSurfaceCard contentClassName="space-y-3 p-6">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </LeaderSurfaceCard>
    )
  }

  return (
    <LeaderSurfaceCard>
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            {columns.map((c) => (
              <TableHead key={c.key} className="h-11 bg-muted/40 font-medium">{c.title}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={columns.length} className="h-28 text-center text-muted-foreground">'暂无数据'</TableCell>
            </TableRow>
          ) : (
            rows.map((row, i) => (
              <TableRow key={String(row.id ?? i)}>
                {columns.map((c) => (
                  <TableCell key={c.key} className="py-3">
                    {c.render ? c.render(row) : String(row[c.key] ?? '')}
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
        <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-foreground" onClick={onEdit} title='编辑'>
          <Pencil className="size-3.5" />
        </Button>
      )}
      {onDelete && (
        <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-destructive" onClick={onDelete} title='删除'>
          <Trash2 className="size-3.5" />
        </Button>
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
          <p className="text-xs text-muted-foreground">'效期健康度'</p>
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

export { Badge, Button, Card, CardContent, CardHeader, CardTitle }
