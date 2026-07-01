import { cn } from 'lib/utils'

/** 表单/列表内嵌表格外框 — Apple HIG 圆角容器 */
export function GridTableFrame({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div
      className={cn(
        'grid-table-frame overflow-x-auto rounded-[10px] border border-border/50 bg-background',
        className,
      )}
    >
      {children}
    </div>
  )
}

/** Apple 风列表外框 — 白卡 + 轻阴影 + 大圆角（macOS / iOS grouped table） */
export const appleTableFrameClass =
  'overflow-hidden rounded-xl border border-border/30 bg-card shadow-[0_1px_4px_hsl(0_0%_0%/0.05),0_0_0_0.5px_hsl(0_0%_0%/0.03)]'

export function AppleTableFrame({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn(appleTableFrameClass, 'overflow-x-auto [-webkit-overflow-scrolling:touch]', className)}>
      {children}
    </div>
  )
}

/** Apple 风表头 — secondary 底 + caption 字阶 */
export const appleTableHeadClass =
  'h-9 whitespace-nowrap bg-secondary/50 px-3 text-left text-[11px] font-semibold uppercase tracking-[0.05em] text-muted-foreground/75 first:pl-5 last:pr-5'

/** Apple 风单元格 */
export const appleTableCellClass =
  'whitespace-nowrap px-3 py-2.5 align-middle first:pl-5 last:pr-5'

/** Apple 风行 — 发丝分隔 + hover tint */
export const appleTableRowClass =
  'border-b border-border/20 bg-card transition-colors duration-150 last:border-b-0 hover:bg-foreground/[0.025]'

/** 数据列表表 — 无竖线、行分隔、宽松内边距（Apple Settings / Reminders 列表风格） */
export const imesDataTableClass = 'imes-data-table w-full border-collapse text-sm'

export const gridTableClass = 'w-full border-collapse text-sm'

/** 表头 — 无底色，仅底部分隔线（macOS 列表头） */
export const gridTableHeadClass =
  'group/th h-10 border-b border-border/30 px-4 text-left text-[11px] font-medium text-muted-foreground'

export const gridTableCellClass =
  'border-0 px-4 py-3 align-middle text-[13px] text-foreground/88'

/** 行 — 统一透明底，仅 hover 微 tint，无斑马纹 */
export const gridTableRowClass =
  'border-b border-border/25 bg-transparent transition-colors duration-150 last:border-b-0 hover:bg-foreground/[0.03]'

export const gridTableRowLastClass = 'border-b-0'

/** 表格内编码 / 单号 — SF Pro 数字栈 + 紧凑字距 */
export function TableCodeCell({ children, className }: { children?: React.ReactNode; className?: string }) {
  const raw = children == null || children === '' ? null : String(children)
  if (!raw) return null
  return (
    <span
      className={cn(
        'font-number text-[13px] font-medium leading-none tracking-tight text-foreground',
        className,
      )}
    >
      {raw}
    </span>
  )
}

export const CODE_COLUMN_KEYS = new Set([
  'code',
  'orderNo',
  'contractNo',
  'batchNo',
  'qrCode',
  'shelfCode',
])

export function isCodeColumn(col: { key: string; cell?: 'code' | 'text' | 'default' }) {
  if (col.cell === 'code') return true
  if (col.cell === 'text' || col.cell === 'default') return false
  return CODE_COLUMN_KEYS.has(col.key)
}

/** 表格内嵌输入框 — 轻量描边，与单元格网格协调 */
export const gridTableInputClass = 'h-8 bg-transparent text-sm shadow-none'

export const gridTableSelectTriggerClass = 'h-8 w-full min-w-0 border-input bg-transparent shadow-none'
