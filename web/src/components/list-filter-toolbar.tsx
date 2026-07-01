import type { ReactNode } from 'react'
import { cn } from 'lib/utils'
import {
  listFilterFieldCorpClass,
  listFilterFieldDateClass,
  listFilterFieldOddNbrClass,
  listToolbarFiltersGrowWrapClass,
  listToolbarTrailingInWrapClass,
  listToolbarUnifiedWrapClass,
} from 'lib/list-index-chrome'

export function ListFilterToolbar({
  children,
  trailing,
  className,
  ariaLabel = '筛选',
}: {
  children: ReactNode
  trailing?: ReactNode
  className?: string
  ariaLabel?: string
}) {
  return (
    <div className={cn('list-filter-toolbar mb-3 min-w-0 shrink-0 border border-transparent px-1 py-0.5', className)}>
      <div className={listToolbarUnifiedWrapClass} role="toolbar" aria-label={ariaLabel}>
        <div className={cn(listToolbarFiltersGrowWrapClass, 'list-filter-fields min-w-0')}>{children}</div>
        {trailing ? (
          <div className={cn(listToolbarTrailingInWrapClass, 'min-w-0 sm:min-w-max')}>{trailing}</div>
        ) : null}
      </div>
    </div>
  )
}

type ListFilterFieldVariant = 'oddNbr' | 'corp' | 'date'

const fieldVariantClass: Record<ListFilterFieldVariant, string> = {
  oddNbr: listFilterFieldOddNbrClass,
  corp: listFilterFieldCorpClass,
  date: listFilterFieldDateClass,
}

export function ListFilterField({
  variant,
  children,
  className,
}: {
  variant: ListFilterFieldVariant
  children: ReactNode
  className?: string
}) {
  return <div className={cn('list-filter-field', fieldVariantClass[variant], className)}>{children}</div>
}
