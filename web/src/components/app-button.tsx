import { Plus } from 'lucide-react'
import { forwardRef } from 'react'
import { Button, type ButtonProps } from 'components/ui/button'
import { cn } from 'lib/utils'

/** 页头 / 工具栏 — 轻量描边胶囊 */
export const toolbarButtonClass = cn(
  'h-7 gap-1.5 rounded-full border-border/70 bg-background px-3 text-[12px] font-medium text-foreground/80 shadow-none',
  'hover:border-border hover:bg-muted/40 hover:text-foreground',
)

/** 表单顶栏 — 主操作（与列表页 PageCreateButton 同级胶囊样式） */
export const formPrimaryButtonClass = cn(
  toolbarButtonClass,
  'min-w-[5rem] border-primary bg-primary px-4 font-semibold text-primary-foreground',
  'hover:border-primary hover:bg-primary/92 hover:text-primary-foreground',
)

/** 表单顶栏 — 次要操作 */
export const formGhostButtonClass = cn(
  toolbarButtonClass,
  'border border-border/55 bg-card font-medium text-foreground/72',
  'hover:border-border hover:bg-muted/35 hover:text-foreground',
)

export function PageActionButton({ className, children, ...props }: ButtonProps) {
  return (
    <Button variant="outline" size="sm" className={cn(toolbarButtonClass, className)} {...props}>
      {children}
    </Button>
  )
}

export function PageCreateButton({
  label,
  className,
  ...props
}: Omit<ButtonProps, 'children'> & { label: string }) {
  return (
    <PageActionButton className={className} {...props}>
      <Plus className="size-3.5" strokeWidth={2.25} />
      {label}
    </PageActionButton>
  )
}

export const ToolbarButton = forwardRef<HTMLButtonElement, ButtonProps>(function ToolbarButton(
  { className, children, ...props },
  ref,
) {
  return (
    <Button
      ref={ref}
      variant="ghost"
      size="sm"
      className={cn(toolbarButtonClass, 'border', className)}
      {...props}
    >
      {children}
    </Button>
  )
})
ToolbarButton.displayName = 'ToolbarButton'
