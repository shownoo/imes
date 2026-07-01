import { useState } from 'react'
import {
  format as fnsFormat,
  subDays,
  startOfMonth,
  endOfMonth,
  subMonths,
  startOfDay,
  endOfDay,
  startOfYear,
  subYears,
  startOfWeek,
  endOfWeek,
} from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { CalendarIcon } from 'lucide-react'
import type { DateRange } from 'react-day-picker'
import { cn } from 'lib/utils'
import { Button } from 'components/ui/button'
import { Calendar } from 'components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from 'components/ui/popover'
import { listFilterFocusClass, listFilterOpenClass, listRangePickerTriggerClass } from 'lib/list-index-chrome'

type RangePickerProps = {
  placeholder?: string
  className?: string
  onChange?: (dates: [string, string] | null) => void
}

const datePresets = [
  { name: '今天', value: 'today' },
  { name: '昨天', value: 'yesterday' },
  { name: '本周', value: 'thisWeek' },
  { name: '上周', value: 'lastWeek' },
  { name: '最近7天', value: 'last7Days' },
  { name: '最近28天', value: 'last28Days' },
  { name: '本月', value: 'thisMonth' },
  { name: '上月', value: 'lastMonth' },
  { name: '今年', value: 'thisYear' },
  { name: '去年', value: 'lastYear' },
]

const fmt = (d: Date) => fnsFormat(d, 'yyyy-MM-dd')
const fmtDisplay = (d: Date) => fnsFormat(d, 'yyyy/MM/dd')

export function RangePicker({ onChange, className, placeholder = '创建日期' }: RangePickerProps) {
  const [date, setDate] = useState<DateRange | undefined>()
  const [open, setOpen] = useState(false)
  const [activePreset, setActivePreset] = useState<string | null>(null)
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date())

  const emitChange = (range: DateRange | undefined) => {
    if (range?.from && range?.to) {
      onChange?.([fmt(range.from), fmt(range.to)])
    } else {
      onChange?.(null)
    }
  }

  const applyRange = (range: DateRange, preset: string | null, closeOnComplete = false) => {
    setDate(range)
    setCurrentMonth(range.from ?? new Date())
    setActivePreset(preset)
    emitChange(range)
    if (closeOnComplete && range.from && range.to) {
      setOpen(false)
    }
  }

  const handlePreset = (type: string) => {
    const today = new Date()
    let from: Date
    let to: Date

    switch (type) {
      case 'today':
        from = startOfDay(today)
        to = endOfDay(today)
        break
      case 'yesterday': {
        const d = subDays(today, 1)
        from = startOfDay(d)
        to = endOfDay(d)
        break
      }
      case 'thisWeek':
        from = startOfWeek(today, { weekStartsOn: 1 })
        to = endOfDay(today)
        break
      case 'lastWeek': {
        const lastWeekStart = startOfWeek(subDays(today, 7), { weekStartsOn: 1 })
        from = lastWeekStart
        to = endOfWeek(lastWeekStart, { weekStartsOn: 1 })
        break
      }
      case 'last7Days':
        from = startOfDay(subDays(today, 6))
        to = endOfDay(today)
        break
      case 'last28Days':
        from = startOfDay(subDays(today, 27))
        to = endOfDay(today)
        break
      case 'thisMonth':
        from = startOfMonth(today)
        to = endOfDay(today)
        break
      case 'lastMonth': {
        const lm = subMonths(today, 1)
        from = startOfMonth(lm)
        to = endOfMonth(lm)
        break
      }
      case 'thisYear':
        from = startOfYear(today)
        to = endOfDay(today)
        break
      case 'lastYear': {
        const ly = subYears(today, 1)
        from = startOfYear(ly)
        to = new Date(ly.getFullYear(), 11, 31, 23, 59, 59)
        break
      }
      default:
        return
    }

    applyRange({ from, to }, type, true)
  }

  const clear = () => {
    setDate(undefined)
    setActivePreset(null)
    onChange?.(null)
  }

  return (
    <div className={cn('grid gap-2', listRangePickerTriggerClass, className)}>
      <Popover open={open} onOpenChange={setOpen} modal>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              'w-full justify-start text-left font-normal',
              listFilterFocusClass,
              listFilterOpenClass,
              !date && 'text-muted-foreground',
            )}
          >
            <CalendarIcon className="mr-1.5 size-3.5 shrink-0 opacity-70" />
            {date?.from ? (
              date.to ? (
                <span className="truncate">
                  {fmtDisplay(date.from)} ~ {fmtDisplay(date.to)}
                </span>
              ) : (
                fmtDisplay(date.from)
              )
            ) : (
              <span>{placeholder}</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="range-picker-panel z-[100] w-auto overflow-hidden rounded-xl border border-border/60 bg-popover p-0 shadow-xl"
          align="start"
          sideOffset={6}
        >
          <div className="flex items-start">
            <aside className="flex w-[5.75rem] shrink-0 flex-col gap-0.5 border-r border-border/50 bg-muted/20 p-2">
              {datePresets.map((preset) => (
                <button
                  key={preset.value}
                  type="button"
                  className={cn(
                    'rounded-md px-2 py-1.5 text-left text-xs transition-colors',
                    activePreset === preset.value
                      ? 'bg-primary text-primary-foreground'
                      : 'text-foreground/85 hover:bg-muted/60',
                  )}
                  onClick={() => handlePreset(preset.value)}
                >
                  {preset.name}
                </button>
              ))}
              {date ? (
                <button
                  type="button"
                  className="mt-1 rounded-md px-2 py-1.5 text-left text-xs text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
                  onClick={clear}
                >
                  清除
                </button>
              ) : null}
            </aside>
            <Calendar
              className="shrink-0 p-2"
              mode="range"
              selected={date}
              month={currentMonth}
              onMonthChange={setCurrentMonth}
              onSelect={(newDate) => {
                setDate(newDate)
                setActivePreset(null)
                emitChange(newDate)
                if (newDate?.from && newDate?.to) {
                  setOpen(false)
                }
              }}
              locale={zhCN}
              weekStartsOn={1}
            />
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}

export function toDateTimeStart(date: string) {
  return `${date}T00:00:00.000`
}
