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

const navShellClass = 'w-full rounded-xl border border-border/50 bg-muted/30 p-1'
const navListClass = 'flex w-full gap-0.5'

function navItemClass(active: boolean) {
  return cn(
    'flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-2.5 text-[13px] transition-all duration-150',
    active
      ? 'bg-background font-medium text-foreground shadow-sm'
      : 'text-muted-foreground hover:bg-background/60 hover:text-foreground',
  )
}

type SectionMenuProps = {
  items: SectionMenuItem[]
  value: string
  onChange: (value: string) => void
  trailing?: ReactNode
  className?: string
}

export function SectionMenu({ items, value, onChange, trailing, className }: SectionMenuProps) {
  return (
    <div className={cn('space-y-3', className)}>
      <nav className={navShellClass}>
        <div className={navListClass}>
          {items.map(({ value: itemValue, label, icon: Icon }) => {
            const active = value === itemValue
            return (
              <button
                key={itemValue}
                type="button"
                onClick={() => onChange(itemValue)}
                className={navItemClass(active)}
              >
                {Icon && <Icon className="size-3.5 shrink-0 opacity-80" strokeWidth={active ? 2.25 : 2} />}
                <span>{label}</span>
              </button>
            )
          })}
        </div>
      </nav>
      {trailing ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">{trailing}</div>
      ) : null}
    </div>
  )
}

export function SectionNav({ items, className }: { items: SectionNavItem[]; className?: string }) {
  return (
    <nav className={cn(navShellClass, className)}>
      <div className={navListClass}>
        {items.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} className={({ isActive }) => navItemClass(isActive)}>
            {Icon && <Icon className="size-3.5 shrink-0 opacity-80" strokeWidth={2} />}
            <span>{label}</span>
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

export function ListToolbar({ search, action }: { search?: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      {search ? <div className="w-full sm:max-w-sm">{search}</div> : null}
      {action ? <div className="shrink-0 sm:ml-auto">{action}</div> : null}
    </div>
  )
}

export function SearchInputShell({ children }: { children: ReactNode }) {
  return <div className="relative w-full">{children}</div>
}
