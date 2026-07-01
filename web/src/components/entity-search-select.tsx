import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown, X } from 'lucide-react'
import { Input } from 'components/ui/input'
import { cn } from 'lib/utils'
import type { EntitySearchItem, EntitySearchSource } from 'lib/entity-search'
import { useDebouncedValue } from 'lib/use-debounced-value'

export function EntitySearchSelect({
  items,
  value,
  onChange,
  buildIndex,
  filterItems,
  placeholder = '请选择',
  emptyLabel = '无匹配结果',
  allowClear,
  className,
  debounceTime = 300,
}: {
  items: EntitySearchSource[]
  value: string
  onChange: (id: string) => void
  buildIndex: (items: EntitySearchSource[]) => EntitySearchItem[]
  filterItems: (index: EntitySearchItem[], query: string) => EntitySearchItem[]
  placeholder?: string
  emptyLabel?: string
  allowClear?: boolean
  className?: string
  debounceTime?: number
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const debouncedQuery = useDebouncedValue(query, debounceTime)
  const isSelectingRef = useRef(false)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [dropdownStyle, setDropdownStyle] = useState<CSSProperties>({})

  const index = useMemo(() => buildIndex(items), [buildIndex, items])

  const selected = useMemo(() => index.find((item) => item.id === value), [index, value])

  const filtered = useMemo(
    () => filterItems(index, debouncedQuery),
    [index, debouncedQuery, filterItems],
  )

  useEffect(() => {
    if (!open || !wrapperRef.current) return
    const rect = wrapperRef.current.getBoundingClientRect()
    setDropdownStyle({
      position: 'fixed',
      top: rect.bottom + 4,
      left: rect.left,
      width: Math.max(rect.width, 240),
      zIndex: 9999,
    })
  }, [open, filtered.length, debouncedQuery])

  const displayValue = open ? query : (selected?.label ?? '')

  const handleSelect = (id: string) => {
    isSelectingRef.current = true
    onChange(id)
    setQuery('')
    setOpen(false)
    inputRef.current?.blur()
  }

  return (
    <div ref={wrapperRef} className="relative min-w-0">
      <Input
        ref={inputRef}
        value={displayValue}
        placeholder={placeholder}
        className={cn('pr-8', allowClear && value && 'pr-14', className)}
        onChange={(e) => {
          setQuery(e.target.value)
          setOpen(true)
        }}
        onFocus={() => {
          setQuery('')
          setOpen(true)
        }}
        onBlur={() => {
          window.setTimeout(() => {
            if (!isSelectingRef.current) {
              setOpen(false)
              setQuery('')
            }
            isSelectingRef.current = false
          }, 150)
        }}
      />
      {allowClear && value && !open ? (
        <button
          type="button"
          className="absolute right-7 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-muted-foreground"
          onMouseDown={(e) => {
            e.preventDefault()
            onChange('')
            setQuery('')
          }}
        >
          <X className="size-3.5" />
        </button>
      ) : null}
      <ChevronDown
        className={cn(
          'pointer-events-none absolute right-2 top-1/2 size-4 -translate-y-1/2 opacity-50 transition-transform',
          open && 'rotate-180',
        )}
      />
      {open &&
        createPortal(
          <div
            className="max-h-60 overflow-auto rounded-xl border border-border/40 bg-popover p-1 shadow-md"
            style={dropdownStyle}
          >
            {filtered.length === 0 ? (
              <div className="px-2.5 py-2 text-center text-[13px] text-muted-foreground">
                {query.trim() && query !== debouncedQuery ? '搜索中…' : emptyLabel}
              </div>
            ) : (
              filtered.map((item) => {
                const isSelected = item.id === value
                return (
                  <div
                    key={item.id}
                    className={cn(
                      'cursor-pointer rounded-lg px-2.5 py-1.5 text-[13px] transition-colors hover:bg-accent hover:text-accent-foreground',
                      isSelected && 'bg-accent font-medium text-accent-foreground',
                    )}
                    onMouseDown={(e) => {
                      e.preventDefault()
                      handleSelect(item.id)
                    }}
                  >
                    {item.label}
                  </div>
                )
              })
            )}
          </div>,
          document.body,
        )}
    </div>
  )
}
