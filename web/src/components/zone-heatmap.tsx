import { cn, formatNumber, STORAGE_ZONE_LABELS } from 'lib/utils'

type ZoneItem = { zone: string; label: string; quantity: number; capacity?: number }

const ZONE_LABELS = STORAGE_ZONE_LABELS

function normalizeItems(
  data: Array<ZoneItem> | Record<string, number>,
): ZoneItem[] {
  if (Array.isArray(data)) return data
  return Object.entries(data).map(([zone, quantity]) => ({
    zone,
    label: ZONE_LABELS[zone] ?? zone,
    quantity,
    capacity: 0,
  }))
}

function barWidthPct(item: ZoneItem, maxQty: number): number {
  if (item.capacity && item.capacity > 0) {
    return Math.min(100, (item.quantity / item.capacity) * 100)
  }
  return maxQty > 0 ? (item.quantity / maxQty) * 100 : 0
}

function occupancyPct(item: ZoneItem): number {
  if (item.capacity && item.capacity > 0) {
    return Math.min(100, Math.round((item.quantity / item.capacity) * 100))
  }
  return 0
}

/** 占用率 → 热力色阶（蓝 → 金 → 橙） */
function heatBarFill(occupancy: number, hasCapacity: boolean) {
  const heat = hasCapacity ? occupancy : Math.min(100, occupancy || 40)
  const goldAt = Math.min(92, 35 + heat * 0.55)
  const tail = heat >= 80 ? '#f97316' : heat >= 55 ? 'hsl(var(--gold))' : 'color-mix(in srgb, hsl(var(--gold)) 70%, hsl(var(--primary)))'

  return {
    background: `linear-gradient(90deg, hsl(var(--primary)) 0%, color-mix(in srgb, hsl(var(--primary)) 35%, hsl(var(--gold))) ${goldAt * 0.45}%, hsl(var(--gold)) ${goldAt}%, ${tail} 100%)`,
    boxShadow:
      heat >= 50
        ? `0 0 ${6 + heat * 0.12}px color-mix(in srgb, hsl(var(--gold)) ${Math.min(heat, 85)}%, transparent)`
        : undefined,
  }
}

function heatGlow(occupancy: number, hasCapacity: boolean) {
  const heat = hasCapacity ? occupancy : 25
  return {
    cardBg: `linear-gradient(155deg, color-mix(in srgb, var(--leader-accent) ${Math.min(heat * 0.18, 14)}%, var(--leader-card-bg)) 0%, var(--leader-card-bg) 62%)`,
    blob: `color-mix(in srgb, var(--leader-accent) ${40 + heat * 0.4}%, hsl(var(--gold)))`,
    blobOpacity: 0.12 + heat * 0.0025,
  }
}

function ZoneHeatCell({ item, maxQty }: { item: ZoneItem; maxQty: number }) {
  const hasCapacity = Boolean(item.capacity && item.capacity > 0)
  const occupancy = occupancyPct(item)
  const barWidth = barWidthPct(item, maxQty)
  const glow = heatGlow(hasCapacity ? occupancy : barWidth, hasCapacity)
  const fillStyle = heatBarFill(hasCapacity ? occupancy : barWidth, hasCapacity)

  return (
    <div
      className="group relative overflow-hidden rounded-xl border p-4 transition-shadow duration-300 hover:shadow-md"
      style={{
        borderColor: 'var(--leader-card-border)',
        background: glow.cardBg,
      }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -right-6 -top-6 size-28 rounded-full blur-2xl transition-opacity duration-500 group-hover:opacity-100"
        style={{ background: glow.blob, opacity: glow.blobOpacity }}
      />

      <div className="relative mb-3 flex items-start justify-between gap-2">
        <div>
          <p
            className="text-lg font-bold leading-none tracking-tight"
            style={{ color: 'var(--leader-text)' }}
          >
            {item.zone}
          </p>
          <p className="mt-1 text-xs" style={{ color: 'var(--leader-text-muted)' }}>
            {item.label}
          </p>
        </div>
        <p
          className="text-xl font-bold tabular-nums leading-none"
          style={{ fontFamily: 'var(--leader-font-number)', color: 'var(--leader-accent)' }}
        >
          {formatNumber(item.quantity)}
        </p>
      </div>

      <div
        className="relative h-3 overflow-hidden rounded-full"
        style={{
          background: 'color-mix(in srgb, var(--leader-accent) 10%, var(--leader-card-bg))',
          boxShadow: 'inset 0 1px 2px color-mix(in srgb, var(--leader-accent) 8%, transparent)',
        }}
      >
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-[width] duration-700 ease-out"
          style={{ width: `${barWidth}%`, ...fillStyle }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-0 rounded-full"
          style={{
            width: `${barWidth}%`,
            background: 'linear-gradient(180deg, rgba(255,255,255,0.42) 0%, rgba(255,255,255,0) 55%)',
          }}
        />
      </div>

      {hasCapacity ? (
        <p className="relative mt-2 flex items-center justify-between text-[10px]" style={{ color: 'var(--leader-text-muted)' }}>
          <span>库容 {formatNumber(item.capacity!)} · 占用 {occupancy}%</span>
          <span
            className={cn(
              'rounded px-1.5 py-0.5 font-medium tabular-nums',
              occupancy >= 80 && 'bg-orange-500/15 text-orange-600 dark:text-orange-400',
              occupancy >= 55 && occupancy < 80 && 'bg-amber-500/12 text-amber-700 dark:text-amber-400',
              occupancy < 55 && 'bg-primary/10 text-primary',
            )}
          >
            {occupancy >= 80 ? '高负载' : occupancy >= 55 ? '适中' : '充裕'}
          </span>
        </p>
      ) : null}
    </div>
  )
}

export function ZoneHeatmap({
  data,
}: {
  data: Array<ZoneItem> | Record<string, number>
}) {
  const items = normalizeItems(data)
  const maxQty = Math.max(...items.map((i) => i.quantity), 1)

  return (
    <div>
      <div className="grid grid-cols-2 gap-4">
        {items.map((item) => (
          <ZoneHeatCell key={item.zone} item={item} maxQty={maxQty} />
        ))}
      </div>
      <div
        className="mt-4 flex items-center justify-between gap-3 text-[10px]"
        style={{ color: 'var(--leader-text-muted)' }}
      >
        <span>占用率热力</span>
        <div className="flex flex-1 items-center justify-end gap-2">
          <span>低</span>
          <div
            className="h-1.5 max-w-[7rem] flex-1 rounded-full"
            style={{
              background:
                'linear-gradient(90deg, hsl(var(--primary)) 0%, hsl(var(--gold)) 55%, #f97316 100%)',
            }}
          />
          <span>高</span>
        </div>
      </div>
    </div>
  )
}
