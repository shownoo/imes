import { Delete } from 'lucide-react'
import { Button } from 'components/ui/button'
import { cn } from 'lib/utils'

type NumericKeypadProps = {
  value: number
  onChange: (next: number) => void
  max?: number
  className?: string
}

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '清空', '0', 'del'] as const

export function NumericKeypad({ value, onChange, max, className }: NumericKeypadProps) {
  const applyDigit = (digit: string) => {
    const raw = value <= 0 ? digit : `${value}${digit}`
    const next = Number(raw)
    if (Number.isNaN(next)) return
    onChange(max != null ? Math.min(next, max) : next)
  }

  const handleKey = (key: (typeof KEYS)[number]) => {
    if (key === '清空') {
      onChange(0)
      return
    }
    if (key === 'del') {
      const raw = String(value)
      onChange(raw.length <= 1 ? 0 : Number(raw.slice(0, -1)))
      return
    }
    applyDigit(key)
  }

  return (
    <div className={cn('grid grid-cols-3 gap-2', className)}>
      {KEYS.map((key) => (
        <Button
          key={key}
          type="button"
          variant={key === '清空' ? 'outline' : 'secondary'}
          className={cn(
            'h-12 text-lg font-medium tabular-nums',
            key === 'del' && 'px-0',
          )}
          onClick={() => handleKey(key)}
        >
          {key === 'del' ? <Delete className="size-5" /> : key}
        </Button>
      ))}
    </div>
  )
}
