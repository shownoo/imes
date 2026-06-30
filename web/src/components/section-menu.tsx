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

const navShellClass = 'w-full rounded-xl border border-border/60 bg-muted/45 p-1'
const navListClass = 'flex w-full gap-1'
const navItemWrapClass = 'flex min-w-0 flex-1'

function navItemClass(active: boolean) {
  return cn(
    'flex w-full min-w-0 items-center justify-center gap-1.5 rounded-lg px-3 py-2.5 text-[13px] transition-all duration-150',
    active
      ? 'bg-background font-semibold text-foreground shadow-sm ring-1 ring-border/70'
      : 'text-muted-foreground hover:bg-background/55 hover:text-foreground/90',
  )
}

type SectionMenuProps = {
  items: SectionMenuItem[]
  value: string
  onChange: (value: string) => void
  /** 左搜右建工具栏（推荐） */
  toolbar?: { search?: ReactNode; action?: ReactNode }
  /** @deprecated 使用 toolbar */
  trailing?: ReactNode
  className?: string
}

export function SectionMenu({ items, value, onChange, toolbar, trailing, className }: SectionMenuProps) {
  return (
    <div className={cn('space-y-3', className)}>
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
                    className={cn('size-3.5 shrink-0', active ? 'text-primary opacity-100' : 'opacity-70')}
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
                    className={cn('size-3.5 shrink-0', isActive ? 'text-primary opacity-100' : 'opacity-70')}
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
  className,
}: {
  search?: ReactNode
  action?: ReactNode
  className?: string
}) {
  if (!search && !action) return null
  return (
    <div className={cn('flex flex-col gap-3 sm:flex-row sm:items-center', className)}>
      {search ? <div className="w-full sm:max-w-xs lg:max-w-sm">{search}</div> : null}
      {action ? (
        <div className={cn('flex shrink-0', search ? 'sm:ml-auto' : 'ml-auto')}>{action}</div>
      ) : null}
    </div>
  )
}

export function SearchInputShell({ children }: { children: ReactNode }) {
  return <div className="relative w-full">{children}</div>
}
