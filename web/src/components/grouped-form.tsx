import type { ReactNode } from 'react'
import React from 'react'
import { AddButton } from 'components/add-button'
import { InfoTip } from 'components/info-tip'
import { Label } from 'components/ui/label'
import { cn } from 'lib/utils'

/** dbm FormInput — 白底描边，衬在 muted 分组卡片上 */
export const groupedFormInputClass =
  'flex h-8 w-full rounded-lg border border-border bg-white px-3 py-2 text-[13px] text-foreground shadow-none transition-all placeholder:text-muted-foreground/40 focus-visible:outline-none focus-visible:border-primary/35 focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-primary/10 focus-visible:ring-offset-0 dark:bg-card'

export const groupedFormSelectTriggerClass =
  'flex h-8 w-full items-center justify-between rounded-lg border border-border bg-white px-3 py-2 text-[13px] text-foreground shadow-none transition-all focus:border-primary/35 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/10 focus:ring-offset-0 dark:bg-card [&>span]:line-clamp-1 [&>svg]:size-4 [&>svg]:shrink-0 [&>svg]:opacity-50'

/** dbm 详情只读值 — 与输入框同高、无边框 */
export const groupedFormReadonlyClass =
  'block min-h-8 truncate px-1 py-1.5 text-[13px] leading-8 text-foreground/88'

export const groupedFormReadonlyDenseClass =
  'block min-h-7 truncate px-1 py-0.5 text-[13px] leading-7 text-foreground/88'

export function GroupedFormReadonly({
  children,
  className,
  dense,
}: {
  children: ReactNode
  className?: string
  dense?: boolean
}) {
  return (
    <span className={cn(dense ? groupedFormReadonlyDenseClass : groupedFormReadonlyClass, className)}>
      {children}
    </span>
  )
}

/** dbm 详情只读 — 白底描边框，与 FormInput 同款（衬在 muted 分组上） */
export function GroupedFormReadonlyField({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        groupedFormInputClass,
        'flex h-8 cursor-default items-center bg-white text-[13px] text-foreground/88',
        className,
      )}
    >
      <span className="min-w-0 truncate">{children}</span>
    </div>
  )
}

const LABEL_COL = 5
const LABEL_TOTAL = 24

/** dbm FormSection — 圆角分组 + 标题右侧 hairline + muted 底 */
export function GroupedFormSection({
  title,
  tip,
  children,
  className,
  dense,
  flat,
}: {
  title?: string
  tip?: string
  children: ReactNode
  className?: string
  dense?: boolean
  flat?: boolean
}) {
  const items = React.Children.toArray(children).filter(Boolean)
  const rowDivider = dense ? 'border-border/30' : 'border-border/40'

  return (
    <div className={cn('min-w-0', className)}>
      {title && (
        <div className={cn('flex items-center gap-1.5', dense ? 'mb-0' : 'mb-1')}>
          <span
            className={cn(
              'font-semibold tracking-wide',
              flat && dense
                ? 'text-[10.5px] text-foreground/55'
                : dense
                  ? 'text-[11px] text-foreground/65'
                  : 'text-[11.5px] text-foreground/65',
            )}
          >
            {title}
          </span>
          {tip && <InfoTip side="right">{tip}</InfoTip>}
          <div className={cn('h-px flex-1', dense ? 'bg-border/35' : 'bg-border/40')} />
        </div>
      )}
      <div
        data-form-section
        className={cn(
          'min-w-0',
          flat
            ? 'rounded-none border-0 bg-transparent shadow-none'
            : dense
              ? 'rounded-lg border border-border/40 bg-muted/25 shadow-none'
              : 'rounded-xl border border-border/50 bg-muted/25 shadow-[0_1px_2px_hsl(0_0%_0%/0.03)]',
        )}
      >
        {items.map((child, i) => (
          <div
            key={i}
            className={i < items.length - 1 ? cn('border-b', rowDivider) : undefined}
          >
            {child}
          </div>
        ))}
      </div>
    </div>
  )
}

/** dbm FormSectionRow — lg 双列 + 竖向 hairline */
export function GroupedFormRow({
  children,
  dense,
  className,
}: {
  children: ReactNode
  dense?: boolean
  className?: string
}) {
  const items = React.Children.toArray(children).filter(Boolean)
  const vDiv = dense ? 'border-border/30' : 'border-border/40'
  if (items.length === 1) return <>{items[0]}</>
  return (
    <div className={cn('flex flex-col lg:flex-row lg:items-center', className)}>
      <div className={cn('min-w-0 flex-1 border-b lg:border-b-0 lg:border-r', vDiv)}>
        {items[0]}
      </div>
      <div className="min-w-0 flex-1">{items[1]}</div>
    </div>
  )
}

/** dbm FormItem — labelCol 5 / wrapperCol 19，styleFormItem padding */
export function GroupedFormItem({
  label,
  tip,
  required,
  children,
  className,
  extra,
  dense,
}: {
  label?: string
  tip?: string
  required?: boolean
  children: ReactNode
  className?: string
  extra?: ReactNode
  dense?: boolean
}) {
  const labelWidth = `${(LABEL_COL / LABEL_TOTAL) * 100}%`

  if (!label) {
    return (
      <div
        className={cn('min-w-0 w-full', dense ? 'px-3 py-1' : 'px-3.5 py-1.5', className)}
        style={{ marginBottom: 0 }}
      >
        {children}
      </div>
    )
  }

  return (
    <div
      className={cn('flex min-w-0 w-full items-center', className)}
      style={{ marginBottom: 0, padding: dense ? '2px 12px' : '6px 14px' }}
    >
      <Label
        className={cn(
          'shrink-0 pr-2.5 text-right font-semibold tracking-tight text-foreground/85',
          dense ? 'text-[11px]' : 'text-[12px]',
        )}
        style={{ width: labelWidth }}
      >
        {required && <span className="mr-0.5 text-destructive">*</span>}
        {label}
        {tip && (
          <span className="ml-0.5 inline-flex align-middle">
            <InfoTip side="right">{tip}</InfoTip>
          </span>
        )}
      </Label>
      <div className="min-w-0 flex-1">
        {children}
        {extra && <p className="mt-0.5 text-xs text-muted-foreground/60">{extra}</p>}
      </div>
    </div>
  )
}

/** dbm 表单分区堆叠 — space-y-3 p-1 */
export function GroupedFormStack({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('space-y-3 p-1', className)}>{children}</div>
}

/** dbm 采购单备注 — 分组外弱化 textarea，不在 FormSection 内 */
export function GroupedFormRemark({
  label = '备注',
  value,
  onChange,
  placeholder,
  className,
}: {
  label?: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}) {
  return (
    <div className={cn('mb-1 opacity-80', className)} style={{ marginBottom: 4 }}>
      <GroupedFormItem label={label}>
        <textarea
          rows={2}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className="flex min-h-[4.5rem] w-full resize-none overflow-hidden rounded-lg border border-border bg-white px-3 py-2 text-[13px] text-foreground shadow-none transition-all placeholder:text-muted-foreground/40 focus-visible:border-primary/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/10"
        />
      </GroupedFormItem>
    </div>
  )
}

/** dbm 采购单/订单 — 清单标题 + hairline + 表格 + 下方添加行 */
export function DocumentLinesSection({
  title,
  tip,
  caption,
  trailing,
  children,
  onAddLine,
  addTitle,
  footerExtra,
  className,
}: {
  title: string
  tip?: string
  /** Apple footnote — 标题下可见说明，不占用 InfoTip */
  caption?: string
  trailing?: ReactNode
  children: ReactNode
  onAddLine?: () => void
  addTitle?: string
  /** 与「添加行」同排，靠右或紧随其后 */
  footerExtra?: ReactNode
  className?: string
}) {
  return (
    <div className={cn('mt-1', className)}>
      <div className="mb-2 flex items-center justify-between gap-3 px-0.5">
        <div className="flex min-w-0 flex-1 items-center gap-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
            {title}
          </span>
          {tip && <InfoTip side="right">{tip}</InfoTip>}
        </div>
        {trailing ? <div className="flex shrink-0 items-center gap-2">{trailing}</div> : null}
      </div>
      {caption ? (
        <p className="mb-2 px-0.5 text-[12px] leading-relaxed text-muted-foreground/80">{caption}</p>
      ) : null}
      {children}
      {onAddLine || footerExtra ? (
        <div className="mt-0.5 flex flex-wrap items-center gap-2">
          {onAddLine ? (
            <AddButton
              variant="row"
              title={addTitle ?? title}
              className="w-auto shrink-0"
              onClick={onAddLine}
            />
          ) : null}
          {footerExtra}
        </div>
      ) : null}
    </div>
  )
}
