import * as React from 'react'
import { Input } from 'components/ui/input'

function debounce<TArgs extends unknown[]>(func: (...args: TArgs) => void, wait: number) {
  let timeout: ReturnType<typeof setTimeout> | null = null
  return (...args: TArgs) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

type DebounceInputProps = Omit<React.ComponentProps<typeof Input>, 'onChange'> & {
  /** 防抖结束后触发查询（对齐 dbm DebounceInput） */
  onSearch?: (value: string) => void
  debounceTime?: number
  onPressEnter?: React.KeyboardEventHandler<HTMLInputElement>
}

/** 列表筛选搜索框 — 默认 500ms 防抖，避免每键触发 GraphQL 请求 */
export function DebounceInput({
  onSearch,
  debounceTime = 500,
  onPressEnter,
  onKeyDown,
  ...rest
}: DebounceInputProps) {
  const debouncedFn = React.useMemo(
    () => debounce((value: string) => onSearch?.(value), debounceTime),
    [onSearch, debounceTime],
  )

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    debouncedFn(e.target.value)
  }

  return (
    <Input
      {...rest}
      onChange={handleChange}
      onKeyDown={(e) => {
        onKeyDown?.(e)
        if (e.key === 'Enter') onPressEnter?.(e)
      }}
    />
  )
}
