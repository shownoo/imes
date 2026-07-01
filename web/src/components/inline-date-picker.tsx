import { useMemo, useState } from 'react'
import { CalendarIcon } from 'lucide-react'
import { format, parse } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { cn } from 'lib/utils'
import { Button } from 'components/ui/button'
import { Calendar } from 'components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from 'components/ui/popover'
import { groupedFormInputClass } from 'components/grouped-form'

export interface DatePickerProps {
  value?: string
  onChange: (v: string | undefined) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

/** 统一日期选择 — shadcn Calendar + Popover，值格式 yyyy-MM-dd，展示 yyyy/MM/dd */
export function DatePicker({
  value,
  onChange,
  placeholder,
  disabled,
  className,
}: DatePickerProps) {
  const [open, setOpen] = useState(false)
  const selected = useMemo(() => {
    if (value == null || value === '') return undefined
    const d = parse(value, 'yyyy-MM-dd', new Date())
    return Number.isNaN(d.getTime()) ? undefined : d
  }, [value])

  return (
    <Popover open={open} onOpenChange={setOpen} modal>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn(
            groupedFormInputClass,
            'h-8 w-full justify-start px-3 font-normal shadow-none hover:bg-white',
            !selected && 'text-muted-foreground/40',
            className,
          )}
        >
          <CalendarIcon className="mr-2 size-3.5 shrink-0 opacity-50" />
          {selected ? (
            format(selected, 'yyyy/MM/dd')
          ) : (
            <span className="truncate">{placeholder ?? '年/月/日'}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="z-[100] w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selected}
          onSelect={(d) => {
            onChange(d ? format(d, 'yyyy-MM-dd') : undefined)
            setOpen(false)
          }}
          locale={zhCN}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  )
}

/** @deprecated 使用 DatePicker */
export const InlineDatePicker = DatePicker
export type InlineDatePickerProps = DatePickerProps

export function todayDateStr() {
  return format(new Date(), 'yyyy-MM-dd')
}

/** 本地日期 yyyy-MM-dd → ISO（与列表筛选一致，避免 UTC 偏移） */
export function localDateToIso(dateStr: string) {
  return new Date(`${dateStr}T00:00:00`).toISOString()
}

export function parseLocalDateStr(dateStr: string) {
  const d = parse(dateStr, 'yyyy-MM-dd', new Date())
  return Number.isNaN(d.getTime()) ? null : d
}
