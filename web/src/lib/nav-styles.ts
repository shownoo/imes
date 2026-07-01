import { cn } from 'lib/utils'

/** 弧形胶囊选中态（侧栏 / 顶栏共用基础） */
export function navMenuButtonClass(active: boolean, collapsed?: boolean) {
  return cn(
    'inline-flex items-center h-8 gap-2 text-[12.5px] transition-all duration-200',
    collapsed ? '!size-8 !rounded-lg !p-0 justify-center' : '!rounded-full px-2.5',
    active
      ? '!bg-primary !text-primary-foreground font-medium shadow-sm hover:!bg-primary/90 hover:!text-primary-foreground'
      : 'text-muted-foreground hover:bg-black/[0.04] hover:text-foreground',
    'data-[active=true]:!bg-primary data-[active=true]:!text-primary-foreground',
  )
}

/** 顶栏导航链接 — 水平胶囊，不截断为图标尺寸 */
export function topNavLinkClass(active: boolean) {
  return cn(
    'shrink-0 whitespace-nowrap',
    navMenuButtonClass(active, false),
  )
}

export function sidebarFooterButtonClass(collapsed?: boolean) {
  return cn(
    'flex items-center gap-2 text-[12.5px] text-muted-foreground transition-all duration-200 hover:bg-black/[0.04] hover:text-foreground',
    collapsed ? 'size-8 justify-center rounded-lg p-0' : 'h-8 w-full rounded-full px-2.5',
  )
}
