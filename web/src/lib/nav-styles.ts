import { cn } from 'lib/utils'

/** 弧形胶囊选中态 */
export function navMenuButtonClass(active: boolean, collapsed?: boolean) {
  return cn(
    'h-8 gap-2 text-[12.5px] transition-all duration-200',
    collapsed ? '!size-8 !rounded-lg !p-0 justify-center' : '!rounded-full px-2.5',
    active
      ? '!bg-primary !text-primary-foreground font-medium shadow-sm hover:!bg-primary/90 hover:!text-primary-foreground'
      : 'text-muted-foreground hover:bg-black/[0.04] hover:text-foreground',
    'data-[active=true]:!bg-primary data-[active=true]:!text-primary-foreground',
  )
}

export function sidebarFooterButtonClass(collapsed?: boolean) {
  return cn(
    'flex items-center gap-2 text-[12.5px] text-muted-foreground transition-all duration-200 hover:bg-black/[0.04] hover:text-foreground',
    collapsed ? 'size-8 justify-center rounded-lg p-0' : 'h-8 w-full rounded-full px-2.5',
  )
}
