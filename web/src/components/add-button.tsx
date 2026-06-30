import { Plus, PlusCircle } from 'lucide-react'
import { Button } from 'components/ui/button'
import { cn } from 'lib/utils'

/** 对齐 dbm AddButton */
export function AddButton({
  title,
  onClick,
  variant = 'inline',
  className,
}: {
  title?: string
  onClick?: React.MouseEventHandler<HTMLButtonElement>
  /** inline：行内链接；row：清单下方添加行 */
  variant?: 'inline' | 'row'
  className?: string
}) {
  const t = title?.trim() ?? ''
  const label = !t ? '添加' : t.startsWith('添加') ? t : `添加${t}`

  if (variant === 'row') {
    return (
      <button
        type="button"
        onClick={onClick}
        className={cn(
          'flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left transition-colors',
          'text-[13px] font-medium tracking-tight text-foreground/70',
          'hover:bg-muted/45 hover:text-foreground/90 active:bg-muted/55',
          className,
        )}
      >
        <span
          className="flex size-[22px] shrink-0 items-center justify-center rounded-full bg-zinc-200/90 text-zinc-600"
          aria-hidden
        >
          <Plus className="size-3.5" strokeWidth={2.5} />
        </span>
        {label}
      </button>
    )
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className={cn(
        'h-auto gap-1.5 border-0 p-0 text-muted-foreground hover:bg-transparent hover:text-foreground/80',
        className,
      )}
      onClick={onClick}
    >
      <PlusCircle className="size-4 opacity-70" />
      {label}
    </Button>
  )
}
