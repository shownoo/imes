/** 列表页筛选区样式（对齐 dbm listIndexChrome） */

/** 输入框 / 下拉 / 日期 — 聚焦与展开时统一高亮（含鼠标点击，非仅 focus-visible） */
export const listFilterFocusClass =
  'transition-[border-color,box-shadow] focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/15 focus:ring-offset-0 focus-visible:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/15 focus-visible:ring-offset-0'

export const listFilterOpenClass =
  'data-[state=open]:border-primary/40 data-[state=open]:ring-2 data-[state=open]:ring-primary/15 data-[state=open]:ring-offset-0'

const listFilterFieldBaseClass =
  'h-7 rounded-full border border-border/60 bg-card px-3.5 text-[12px] font-normal text-foreground shadow-none'

export const listFilterInputClass = [
  listFilterFieldBaseClass,
  'w-full placeholder:text-muted-foreground/70',
  listFilterFocusClass,
].join(' ')

export const listFilterSelectTriggerClass = [
  listFilterFieldBaseClass,
  listFilterFocusClass,
  listFilterOpenClass,
].join(' ')

export const listRangePickerTriggerClass =
  '[&>button]:h-7 [&>button]:w-full [&>button]:rounded-full [&>button]:border [&>button]:border-border/60 [&>button]:bg-card [&>button]:px-3.5 [&>button]:text-[12px] [&>button]:font-normal [&>button]:shadow-none [&>button]:text-foreground [&>button]:hover:bg-card [&>button]:hover:text-foreground'

export const listToolbarUnifiedWrapClass =
  'grid w-full min-w-0 max-w-full grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center'

export const listToolbarFiltersGrowWrapClass =
  'flex min-h-0 min-w-0 w-full max-w-full flex-wrap content-start gap-2'

export const listToolbarTrailingInWrapClass =
  'empty:hidden flex min-h-7 shrink-0 items-center justify-end gap-2 border-zinc-200/55 dark:border-zinc-600/55 max-sm:w-full max-sm:border-t max-sm:pt-2 sm:border-l sm:border-t-0 sm:pl-3.5 sm:pt-0'

export const listFilterFieldOddNbrClass = 'min-h-0 w-[10.5rem] shrink-0'
export const listFilterFieldCorpClass = 'min-h-0 w-[16rem] shrink-0'
export const listFilterFieldDateClass = 'min-h-0 w-[14rem] shrink-0'
