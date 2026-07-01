import type { ReactNode } from 'react'
import {
  InsetFormGroup,
  InsetFormRow,
  InsetFormSection,
} from 'components/inset-form-list'
import { appleTableFrameClass } from 'components/grid-table'
import { cn } from 'lib/utils'

/** 详情页分区堆叠 — 组间距疏、标题浮于灰底 */
export function DocumentDetailPageStack({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return <div className={cn('space-y-5 px-0.5', className)}>{children}</div>
}

export function DocumentDetailSection({
  title,
  tip,
  trailing,
  children,
  className,
}: {
  title: string
  tip?: string
  trailing?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <InsetFormSection className={className}>
      <header className="mb-2 flex items-center justify-between gap-3 px-1">
        <div className="flex min-w-0 items-center gap-1">
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
            {title}
          </h3>
          {tip ? (
            <span className="truncate text-[11px] text-muted-foreground/70" title={tip}>
              · {tip}
            </span>
          ) : null}
        </div>
        {trailing ? <div className="shrink-0">{trailing}</div> : null}
      </header>
      {children}
    </InsetFormSection>
  )
}

export function DocumentDetailGroup({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <InsetFormGroup className={cn(appleTableFrameClass, className)}>
      {children}
    </InsetFormGroup>
  )
}

/** 只读值 — 右对齐、次级色（Apple Settings 详情行） */
export const insetDetailValueClass =
  'block w-full truncate text-right text-[15px] leading-snug text-muted-foreground'

/** 只读值 — 右对齐、主色（重要字段） */
export const insetDetailValuePrimaryClass =
  'block w-full truncate text-right text-[15px] leading-snug font-medium text-foreground'

export function DocumentDetailRow({
  label,
  tip,
  children,
  primary,
  className,
}: {
  label: string
  tip?: string
  children: ReactNode
  /** 重要字段用主色字重 */
  primary?: boolean
  className?: string
}) {
  const isCustom = typeof children !== 'string' && typeof children !== 'number'

  return (
    <InsetFormRow label={label} tip={tip} className={className}>
      {isCustom ? (
        <div className="flex min-w-0 flex-1 justify-end">{children}</div>
      ) : (
        <span className={primary ? insetDetailValuePrimaryClass : insetDetailValueClass}>
          {children}
        </span>
      )}
    </InsetFormRow>
  )
}
