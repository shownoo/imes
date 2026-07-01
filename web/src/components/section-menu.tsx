import type { ElementType, ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { cn } from 'lib/utils'

export type SectionMenuItem = {
  value: string
  label: string
  icon?: ElementType
}

export type SectionNavItem = {
  to: string
  label: string
  icon?: ElementType
}

/** Apple HIG / M3 分段控件：内容宽度、紧凑高度；轨道略深以衬托选中白底 */
const navShellClass =
  'inline-flex max-w-full rounded-lg bg-muted p-0.5 dark:bg-muted/50'
const navListClass = 'inline-flex flex-wrap items-center gap-0.5'
const navItemWrapClass = 'shrink-0'

function navItemClass(active: boolean) {
  return cn(
    'inline-flex h-7 items-center gap-1.5 rounded-[6px] px-2.5 text-[12.5px] transition-all duration-150',
    active
      ? 'bg-background font-semibold text-foreground shadow-[0_1px_2px_rgba(0,0,0,0.08),0_0_0_0.5px_rgba(0,0,0,0.04)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.35),0_0_0_0.5px_rgba(255,255,255,0.08)]'
      : 'font-medium text-muted-foreground/75 hover:bg-background/40 hover:text-foreground/70',
  )
}

type SectionMenuProps = {
  items: SectionMenuItem[]
  value: string
  onChange: (value: string) => void
  /** 左搜右建工具栏（Tab 下方独立第二行） */
  toolbar?: { search?: ReactNode; action?: ReactNode }
  /** @deprecated 使用 toolbar */
  trailing?: ReactNode
  className?: string
}

export function SectionMenu({ items, value, onChange, toolbar, trailing, className }: SectionMenuProps) {
  return (
    <div className={cn(toolbar || trailing ? 'space-y-3' : undefined, className)}>
      <nav className={navShellClass}>
        <div className={navListClass}>
          {items.map(({ value: itemValue, label, icon: Icon }) => {
            const active = value === itemValue
            const btn = (
              <button
                type="button"
                onClick={() => onChange(itemValue)}
                className={navItemClass(active)}
              >
                {Icon && (
                  <Icon
                    className={cn('size-3 shrink-0', active ? 'text-foreground' : 'text-muted-foreground/60')}
                    strokeWidth={active ? 2.25 : 2}
                  />
                )}
                <span>{label}</span>
              </button>
            )

            return (
              <span key={itemValue} className={navItemWrapClass}>
                {btn}
              </span>
            )
          })}
        </div>
      </nav>
      {toolbar ? (
        <ListToolbar search={toolbar.search} action={toolbar.action} />
      ) : trailing ? (
        <ListToolbar action={trailing} />
      ) : null}
    </div>
  )
}

export function SectionNav({ items, className }: { items: SectionNavItem[]; className?: string }) {
  return (
    <nav className={cn(navShellClass, className)}>
      <div className={navListClass}>
        {items.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} className={({ isActive }) => cn(navItemWrapClass, navItemClass(isActive))}>
            {({ isActive }) => (
              <>
                {Icon && (
                  <Icon
                    className={cn('size-3 shrink-0', isActive ? 'text-foreground' : 'text-muted-foreground/60')}
                    strokeWidth={isActive ? 2.25 : 2}
                  />
                )}
                <span>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}

export function SectionPanelHeader({ desc, action }: { desc?: string; action?: ReactNode }) {
  if (!desc && !action) return null
  return (
    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      {desc ? <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">{desc}</p> : <span />}
      {action}
    </div>
  )
}

export function ListToolbar({
  search,
  action,
  leading,
  className,
  searchWrapClassName,
}: {
  search?: ReactNode
  action?: ReactNode
  /** 左侧筛选/分段控件，与 search、action 同一行 */
  leading?: ReactNode
  className?: string
  searchWrapClassName?: string
}) {
  if (!search && !action && !leading) return null
  const inline = !!leading
  return (
    <div
      className={cn(
        inline ? 'flex flex-wrap items-center gap-2 sm:gap-3' : 'flex flex-col gap-3 sm:flex-row sm:items-center',
        className,
      )}
    >
      {leading ? <div className="shrink-0">{leading}</div> : null}
      {search ? (
        <div
          className={cn(
            'w-full',
            inline ? 'min-w-[8rem] flex-1 sm:max-w-none' : 'sm:max-w-xs lg:max-w-sm',
            searchWrapClassName,
          )}
        >
          {search}
        </div>
      ) : null}
      {action ? (
        <div className={cn('flex shrink-0', search || inline ? 'ml-auto' : 'ml-auto')}>{action}</div>
      ) : null}
    </div>
  )
}

export function SearchInputShell({ children }: { children: ReactNode }) {
  return <div className="relative w-full">{children}</div>
}
