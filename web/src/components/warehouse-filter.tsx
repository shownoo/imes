import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from 'components/ui/select'
import { listFilterSelectTriggerClass } from 'lib/list-index-chrome'
import { cn } from 'lib/utils'

type WarehouseOption = { id: string; name: string }

/** 仓库筛选 — 分段 pill，适合选项较少的场景 */
export function WarehouseFilterBar({
  value,
  onChange,
  warehouses,
  className,
  label = '仓库',
}: {
  value: string
  onChange: (value: string) => void
  warehouses: WarehouseOption[]
  className?: string
  label?: string
}) {
  const options: Array<{ id: string; name: string }> = [
    { id: 'all', name: `全部${label}` },
    ...warehouses,
  ]

  return (
    <div
      className={cn(
        'inline-flex max-w-full flex-wrap gap-1 rounded-xl border border-border/60 bg-muted/25 p-1',
        className,
      )}
      role="tablist"
      aria-label={`按${label}筛选`}
    >
      {options.map((w) => {
        const active = value === w.id
        return (
          <button
            key={w.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(w.id)}
            className={cn(
              'rounded-lg px-3 py-1.5 text-[13px] transition-all',
              active
                ? 'bg-background font-medium text-foreground shadow-sm ring-1 ring-border/70'
                : 'text-muted-foreground hover:bg-background/60 hover:text-foreground',
            )}
          >
            {w.name}
          </button>
        )
      })}
    </div>
  )
}

export function WarehouseFilter({
  value,
  onChange,
  warehouses,
  className,
  label = '仓库',
}: {
  value: string
  onChange: (value: string) => void
  warehouses: WarehouseOption[]
  className?: string
  label?: string
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className={cn(listFilterSelectTriggerClass, 'w-[9rem]', className)}>
        <SelectValue placeholder={label} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">全部{label}</SelectItem>
        {warehouses.map((w) => (
          <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
