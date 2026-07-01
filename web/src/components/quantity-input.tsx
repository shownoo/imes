import { useEffect, useState, type ComponentProps } from 'react'
import { Input } from 'components/ui/input'
import { cn } from 'lib/utils'

/** 只保留数字，去掉前导零（保留空串与单个 0 供编辑中态） */
export function normalizeQuantityDigits(raw: string) {
  const digits = raw.replace(/\D/g, '')
  if (digits === '') return ''
  if (digits === '0') return '0'
  return String(parseInt(digits, 10))
}

type QuantityInputProps = Omit<ComponentProps<typeof Input>, 'type' | 'value' | 'onChange' | 'inputMode'> & {
  value: number
  onChange: (value: number) => void
  min?: number
}

/** 清单数量 — text + inputMode numeric，避免 type=number 前导零与滚轮问题 */
export function QuantityInput({ value, onChange, min = 1, className, onBlur, onFocus, ...rest }: QuantityInputProps) {
  const [focused, setFocused] = useState(false)
  const [draft, setDraft] = useState('')

  useEffect(() => {
    if (!focused) {
      setDraft(value > 0 ? String(value) : '')
    }
  }, [value, focused])

  const display = focused ? draft : String(value > 0 ? value : min)

  const commit = () => {
    const parsed = draft === '' || draft === '0' ? min : Math.max(min, parseInt(draft, 10) || min)
    onChange(parsed)
    setDraft(String(parsed))
  }

  return (
    <Input
      {...rest}
      type="text"
      inputMode="numeric"
      autoComplete="off"
      className={cn(className)}
      value={display}
      onFocus={(e) => {
        setFocused(true)
        setDraft(value > 0 ? String(value) : '')
        onFocus?.(e)
      }}
      onBlur={(e) => {
        setFocused(false)
        commit()
        onBlur?.(e)
      }}
      onChange={(e) => {
        setDraft(normalizeQuantityDigits(e.target.value))
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.currentTarget.blur()
        }
      }}
    />
  )
}
