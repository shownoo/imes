import type { ReactNode } from 'react'
import { documentDetailShellClass } from 'components/table-form'
import { cn } from 'lib/utils'

/** dbm 详情页 — 只读元信息卡片（可与 footer 组合，如收货进度条） */
export function DocumentDetailMeta({
  children,
  footer,
  className,
}: {
  children: ReactNode
  footer?: ReactNode
  className?: string
}) {
  return (
    <div className={documentDetailShellClass}>
      <dl
        className={cn(
          'grid grid-cols-2 gap-x-5 gap-y-4 px-4 py-5 text-sm sm:grid-cols-4 sm:px-5',
          className,
        )}
      >
        {children}
      </dl>
      {footer ? (
        <div className="border-t border-border/45">{footer}</div>
      ) : null}
    </div>
  )
}

/** dbm 详情页 — 单字段 label / value */
export function DocumentDetailMetaField({
  label,
  children,
  className,
}: {
  label: string
  children: ReactNode
  className?: string
}) {
  return (
    <div className={className}>
      <dt className="text-[13px] text-muted-foreground">{label}</dt>
      <dd className="mt-1.5 min-w-0 text-[13px] text-foreground/90">{children}</dd>
    </div>
  )
}

/** dbm 详情页分区堆叠 — 与 GroupedFormStack 间距一致 */
export function DocumentDetailStack({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return <div className={cn('space-y-3 p-1', className)}>{children}</div>
}

/** dbm 详情页 — 通用内容卡片 */
export function DocumentDetailSection({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div className={cn(documentDetailShellClass, 'px-4 py-5 sm:px-5', className)}>
      {children}
    </div>
  )
}
