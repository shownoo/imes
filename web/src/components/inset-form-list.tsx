import type { ReactNode } from 'react'
import { InfoTip } from 'components/info-tip'
import { cn } from 'lib/utils'

/** iOS Settings 行内输入 — 无边框、右对齐 */
export const insetFormInputClass =
  'inset-form-control h-9 w-full border-0 bg-transparent px-0 py-0 text-right text-[15px] shadow-none placeholder:text-muted-foreground/70 focus-visible:outline-none focus-visible:ring-0'

/** iOS Settings 行内选择 — 无边框、值右对齐、Chevron 贴右 */
export const insetFormSelectTriggerClass =
  'inset-form-control h-9 w-full border-0 bg-transparent px-0 py-0 text-right text-[15px] shadow-none focus:outline-none focus:ring-0 focus-visible:ring-0 [&>span]:line-clamp-1 [&>span]:text-right [&>svg]:size-4 [&>svg]:shrink-0 [&>svg]:opacity-35'

export function InsetFormSection({
  title,
  tip,
  children,
  className,
}: {
  title?: string
  tip?: string
  children: ReactNode
  className?: string
}) {
  return (
    <section className={cn('space-y-2', className)}>
      {title && (
        <header className="flex items-center gap-1 px-1">
          <h3 className="text-xs font-medium tracking-wide text-muted-foreground">{title}</h3>
          {tip && <InfoTip side="right">{tip}</InfoTip>}
        </header>
      )}
      {children}
    </section>
  )
}

export function InsetFormGroup({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        'inset-form-group overflow-hidden rounded-xl border border-border/35 bg-card',
        className,
      )}
    >
      {children}
    </div>
  )
}

export function InsetFormRow({
  label,
  tip,
  required,
  children,
  className,
  block,
}: {
  label: string
  tip?: string
  required?: boolean
  children: ReactNode
  className?: string
  /** 全宽内容（图片上传等） */
  block?: boolean
}) {
  if (block) {
    return (
      <div className={cn('inset-form-row space-y-2 px-4 py-3', className)}>
        <div className="flex items-center gap-0.5">
          <span className="text-[15px] text-foreground">{label}</span>
          {required && <span className="text-destructive">*</span>}
          {tip && <InfoTip side="right">{tip}</InfoTip>}
        </div>
        <div className="min-w-0">{children}</div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'inset-form-row flex min-h-[44px] items-center gap-3 px-4 py-1',
        className,
      )}
    >
      <div className="flex min-w-0 max-w-[38%] shrink-0 items-center gap-0.5 sm:max-w-[9.5rem]">
        <span className="truncate text-[15px] text-foreground">{label}</span>
        {required && <span className="shrink-0 text-destructive/85">*</span>}
        {tip && <InfoTip side="right">{tip}</InfoTip>}
      </div>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  )
}
