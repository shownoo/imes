import { cn } from 'lib/utils'

/** 表格内操作 — link 纯文字 / pill 轻量按钮 */
export function ActionLink({
  children,
  onClick,
  className,
  variant = 'link',
}: {
  children: React.ReactNode
  onClick?: () => void
  className?: string
  variant?: 'link' | 'pill'
}) {
  return (
    <button
      type="button"
      className={cn(
        'inline-flex h-auto cursor-pointer items-center justify-center transition-colors',
        variant === 'pill'
          ? 'rounded-md bg-primary/[0.08] px-2.5 py-1 text-[13px] font-medium text-primary hover:bg-primary/[0.14]'
          : 'p-0 text-[13px] font-medium text-primary hover:underline',
        className,
      )}
      onClick={onClick}
    >
      {children}
    </button>
  )
}
