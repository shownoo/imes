import { cn } from 'lib/utils'

/** 表格内操作链接 — 对齐 dbm EditText */
export function ActionLink({
  children,
  onClick,
  className,
}: {
  children: React.ReactNode
  onClick?: () => void
  className?: string
}) {
  return (
    <button
      type="button"
      className={cn(
        'inline-flex h-auto cursor-pointer p-0 text-[13px] font-medium text-primary hover:underline',
        className,
      )}
      onClick={onClick}
    >
      {children}
    </button>
  )
}
