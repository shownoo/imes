import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from 'components/ui/select'
import { cn } from 'lib/utils'

export function WarehouseFilter({
  value,
  onChange,
  warehouses,
  className,
  label = '仓库',
}: {
  value: string
  onChange: (value: string) => void
  warehouses: Array<{ id: string; name: string }>
  className?: string
  label?: string
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className={cn('h-8 w-[140px] text-xs', className)}>
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
