import { cn } from 'lib/utils'
import './table-form.css'

const shellClass =
  'min-w-0 max-w-full overflow-hidden rounded-xl border border-border/70 bg-card/80 shadow-[0_1px_2px_rgba(0,0,0,0.04)]'

/** dbm 详情页 / 清单外框 — 与 TableForm 同材质 */
export const documentDetailShellClass = shellClass

/** dbm TableForm — 采购/入库清单外框 */
export function TableForm({
  children,
  className,
  wide,
  banner,
}: {
  children: React.ReactNode
  className?: string
  wide?: boolean
  /** 表格顶栏提示（如货位扫描说明） */
  banner?: React.ReactNode
}) {
  return (
    <div className={cn(shellClass, className)}>
      {banner ? (
        <div className="border-b border-border/45 px-4 py-2.5 text-xs text-muted-foreground sm:px-5">
          {banner}
        </div>
      ) : null}
      <div className="min-w-0 max-w-full overflow-x-auto overscroll-x-contain [-webkit-overflow-scrolling:touch]">
        <table className={cn('table-form', wide && 'table-form--wide')}>{children}</table>
      </div>
    </div>
  )
}

export const tableFormReadonlyClass =
  'block truncate px-1 text-[13px] text-foreground/88'

export const tableFormHeaderClass = 'table-form__header overflow-hidden whitespace-nowrap text-center'

export const tableFormCellClass = 'table-form__cell'

export const tableFormIndexClass = 'table-form__cell table-form__index'

/** 清单单元格内输入 — 白底描边 */
export const tableFormInputClass =
  'h-8 w-full min-w-0 rounded-lg border border-border bg-white px-2 text-[13px] shadow-none focus-visible:border-primary/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/10'

export const tableFormSelectTriggerClass =
  'h-8 w-full min-w-0 rounded-lg border border-border bg-white px-2 text-[13px] shadow-none focus:border-primary/35 focus:outline-none focus:ring-2 focus:ring-primary/10 [&>span]:line-clamp-1 [&>svg]:size-4 [&>svg]:opacity-50'
