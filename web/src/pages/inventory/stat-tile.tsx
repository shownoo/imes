import type { LucideIcon } from 'lucide-react'
import { Card, CardContent } from 'components/common'

export function InventoryStatTile({
  label,
  value,
  unit,
  hint,
  icon: Icon,
}: {
  label: string
  value: string | number
  unit?: string
  hint?: string
  icon: LucideIcon
}) {
  return (
    <Card className="transition-colors hover:bg-muted/20">
      <CardContent className="flex items-start gap-3 pt-5">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="size-4" />
        </span>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="mt-0.5 text-xl font-semibold tabular-nums tracking-tight">
            {value}
            {unit ? <span className="ml-1 text-sm font-normal text-muted-foreground">{unit}</span> : null}
          </p>
          {hint ? <p className="mt-0.5 text-[11px] text-muted-foreground">{hint}</p> : null}
        </div>
      </CardContent>
    </Card>
  )
}
