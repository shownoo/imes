import { formatNumber } from 'lib/utils'
import { useTranslation } from 'react-i18next'

export type ChartSegment = { key?: string; label: string; value: number; color?: string; orderCount?: number }
export type TrendPoint = { month: string; label: string; inbound: number; outbound: number }

function chartTotal(items: ChartSegment[]) {
  const { t } = useTranslation()
  return items.reduce((sum, item) => sum + item.value, 0)
}

function DonutChart({ segments, centerLabel }: { segments: ChartSegment[]; centerLabel?: string }) {
  const { t } = useTranslation()
  const total = chartTotal(segments) || 1
  let acc = 0
  const stops = segments
    .filter((s) => s.value > 0)
    .map((seg) => {
      const start = (acc / total) * 100
      acc += seg.value
      const end = (acc / total) * 100
      return `${seg.color ?? 'hsl(var(--primary))'} ${start}% ${end}%`
    })
    .join(', ')

  return (
    <div className="flex items-center gap-4">
      <div className="relative mx-auto size-[7.5rem] shrink-0">
        <div
          className="size-full rounded-full"
          style={{ background: stops ? `conic-gradient(${stops})` : 'color-mix(in srgb, var(--leader-accent) 12%, var(--leader-card-bg))' }}
        />
        <div
          className="absolute inset-[22%] flex flex-col items-center justify-center rounded-full text-center"
          style={{ background: 'var(--leader-card-bg)' }}
        >
          {centerLabel ? (
            <span className="text-[10px] leading-tight" style={{ color: 'var(--leader-text-muted)' }}>{centerLabel}</span>
          ) : null}
          <span className="text-sm font-bold tabular-nums" style={{ color: 'var(--leader-accent)', fontFamily: 'var(--leader-font-number)' }}>
            {formatNumber(total)}
          </span>
        </div>
      </div>
      <ul className="min-w-0 flex-1 space-y-1.5 text-xs">
        {segments.map((seg) => (
          <li key={seg.key ?? seg.label} className="flex items-center justify-between gap-2">
            <span className="flex min-w-0 items-center gap-1.5">
              <span className="size-2 shrink-0 rounded-full" style={{ background: seg.color ?? 'hsl(var(--primary))' }} />
              <span className="truncate" style={{ color: 'var(--leader-text)' }}>{seg.label}</span>
            </span>
            <span className="shrink-0 tabular-nums" style={{ color: 'var(--leader-text-muted)' }}>
              {formatNumber(seg.value)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function VerticalBarChart({ items, valueSuffix = '' }: { items: ChartSegment[]; valueSuffix?: string }) {
  const { t } = useTranslation()
  const max = Math.max(...items.map((i) => i.value), 1)
  const colors = ['hsl(var(--primary))', 'hsl(var(--gold))', '#38bdf8', '#a78bfa', '#34d399', '#fb7185']
  const trackHeight = 120

  return (
    <div className="flex gap-2">
      {items.map((item, idx) => {
        const barHeight = item.value > 0 ? Math.max(4, Math.round((item.value / max) * trackHeight)) : 0
        return (
          <div key={item.key ?? item.label} className="flex min-w-0 flex-1 flex-col items-center gap-2">
            <span className="text-[10px] tabular-nums" style={{ color: 'var(--leader-text-muted)' }}>
              {formatNumber(item.value)}{valueSuffix}
            </span>
            <div className="flex w-full items-end justify-center" style={{ height: trackHeight }}>
              <div
                className="w-full rounded-t-md transition-[height] duration-500"
                style={{
                  height: barHeight,
                  background: item.color ?? colors[idx % colors.length],
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.25)',
                }}
                title={`${item.label}: ${formatNumber(item.value)}`}
              />
            </div>
            <span className="w-full truncate text-center text-[10px]" style={{ color: 'var(--leader-text-muted)' }} title={item.label}>
              {item.label}
            </span>
          </div>
        )
      })}
    </div>
  )
}

function HorizontalBarChart({
  items,
  valueSuffix = '件',
  showOrderCount = false,
}: {
  items: ChartSegment[]
  valueSuffix?: string
  showOrderCount?: boolean
}) {
  const { t } = useTranslation()
  const max = Math.max(...items.map((i) => i.value), 1)
  const colors = ['#0ea5e9', '#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#14b8a6', '#f97316']

  if (!items.length) {
    return <p className="py-8 text-center text-sm" style={{ color: 'var(--leader-text-muted)' }}>{t('暂无出库记录')}</p>
  }

  return (
    <div className="space-y-3">
      {items.map((item, idx) => (
        <div key={item.key ?? item.label}>
          <div className="mb-1 flex items-center justify-between gap-2 text-xs">
            <span className="truncate font-medium" style={{ color: 'var(--leader-text)' }} title={item.label}>{item.label}</span>
            <span className="shrink-0 tabular-nums" style={{ color: 'var(--leader-text-muted)' }}>
              {formatNumber(item.value)}{valueSuffix}
              {showOrderCount && item.orderCount != null ? ` · ${item.orderCount}单` : ''}
            </span>
          </div>
          <div
            className="h-2 overflow-hidden rounded-full"
            style={{ background: 'color-mix(in srgb, var(--leader-accent) 10%, var(--leader-card-bg))' }}
          >
            <div
              className="h-full rounded-full transition-[width] duration-500"
              style={{
                width: `${Math.max(4, Math.round((item.value / max) * 100))}%`,
                background: item.color ?? colors[idx % colors.length],
              }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

function IoTrendChart({ points }: { points: TrendPoint[] }) {
  const { t } = useTranslation()
  const max = Math.max(...points.flatMap((p) => [p.inbound, p.outbound]), 1)
  const trackHeight = 128
  const barHeight = (value: number) => (value > 0 ? Math.max(4, Math.round((value / max) * trackHeight)) : 0)

  return (
    <div className="space-y-3">
      <div className="flex gap-3">
        {points.map((point) => (
          <div key={point.month} className="flex min-w-0 flex-1 flex-col items-center gap-1">
            <div className="flex w-full items-end justify-center gap-1" style={{ height: trackHeight }}>
              <div
                className="w-[42%] rounded-t-sm bg-primary/85"
                style={{ height: barHeight(point.inbound) }}
                title={`入库 ${formatNumber(point.inbound)}`}
              />
              <div
                className="w-[42%] rounded-t-sm"
                style={{ height: barHeight(point.outbound), background: 'hsl(var(--gold))' }}
                title={`出库 ${formatNumber(point.outbound)}`}
              />
            </div>
            <span className="text-[10px]" style={{ color: 'var(--leader-text-muted)' }}>{point.label}</span>
          </div>
        ))}
      </div>
      <div className="flex gap-4 text-[10px]" style={{ color: 'var(--leader-text-muted)' }}>
        <span className="flex items-center gap-1"><span className="size-2 rounded-sm bg-primary/85" />{t('入库')}</span>
        <span className="flex items-center gap-1"><span className="size-2 rounded-sm" style={{ background: 'hsl(var(--gold))' }} />{t('出库')}</span>
      </div>
    </div>
  )
}

export type DashboardChartsData = {
  expiryPie: ChartSegment[]
  zoneBar: ChartSegment[]
  categoryBar: ChartSegment[]
  inboundBar: ChartSegment[]
  outboundBar: ChartSegment[]
  alertPie: ChartSegment[]
  destinationBar: ChartSegment[]
  destinationCity: string
  ioTrend: TrendPoint[]
}

const CATEGORY_COLORS = ['#0ea5e9', '#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

export function DashboardChartExpiryPie({ charts }: { charts: DashboardChartsData }) {
  const { t } = useTranslation()
  return <DonutChart segments={charts.expiryPie} centerLabel="在库件数" />
}

export function DashboardChartAlertPie({ charts }: { charts: DashboardChartsData }) {
  const { t } = useTranslation()
  if (!charts.alertPie.length) {
    return <p className="py-8 text-center text-sm" style={{ color: 'var(--leader-text-muted)' }}>{t('暂无未处理预警')}</p>
  }
  return <DonutChart segments={charts.alertPie} centerLabel="未处理" />
}

export function DashboardChartZoneBar({ charts }: { charts: DashboardChartsData }) {
  const { t } = useTranslation()
  return <VerticalBarChart items={charts.zoneBar} />
}

export function DashboardChartCategoryBar({ charts }: { charts: DashboardChartsData }) {
  const { t } = useTranslation()
  return (
    <VerticalBarChart
      items={charts.categoryBar.map((item, idx) => ({
        ...item,
        color: CATEGORY_COLORS[idx % CATEGORY_COLORS.length],
      }))}
      valueSuffix="种"
    />
  )
}

export function DashboardChartInboundBar({ charts }: { charts: DashboardChartsData }) {
  const { t } = useTranslation()
  return <VerticalBarChart items={charts.inboundBar} valueSuffix="单" />
}

export function DashboardChartOutboundBar({ charts }: { charts: DashboardChartsData }) {
  const { t } = useTranslation()
  return <VerticalBarChart items={charts.outboundBar} valueSuffix="单" />
}

export function DashboardChartDestinationBar({ charts }: { charts: DashboardChartsData }) {
  const { t } = useTranslation()
  return (
    <>
      <HorizontalBarChart items={charts.destinationBar} valueSuffix="件" showOrderCount />
      <p className="mt-3 text-[10px]" style={{ color: 'var(--leader-text-muted)' }}>{t('按所属区汇总出库物资件数（已发运/已完成取实拣量，其余取申请量），并附单数；不含草稿/驳回')}</p>
    </>
  )
}

export function DashboardChartIoTrend({ charts }: { charts: DashboardChartsData }) {
  const { t } = useTranslation()
  return <IoTrendChart points={charts.ioTrend} />
}
