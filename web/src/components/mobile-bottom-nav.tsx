import { NavLink, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { ElementType } from 'react'
import type { AppNavItem } from 'components/app-sidebar'
import { cn } from 'lib/utils'

function BottomNavItem({
  to,
  icon: Icon,
  label,
  end,
}: {
  to: string
  icon: ElementType
  label: string
  end?: boolean
}) {
  const location = useLocation()
  const active = end ? location.pathname === to : location.pathname.startsWith(to)

  return (
    <NavLink
      to={to}
      end={end}
      className={cn(
        'flex min-w-0 flex-1 flex-col items-center gap-0.5 px-1 py-2 text-[10px] leading-none transition-colors',
        active ? 'text-primary' : 'text-muted-foreground',
      )}
    >
      <Icon className="size-5 shrink-0" strokeWidth={active ? 2.25 : 1.75} />
      <span className="max-w-full truncate">{label}</span>
    </NavLink>
  )
}

export function MobileBottomNav({ items }: { items: AppNavItem[] }) {
  const { t } = useTranslation()

  return (
    <nav
      className="flex shrink-0 border-t bg-card/95 backdrop-blur-sm"
      style={{ paddingBottom: 'max(0.35rem, env(safe-area-inset-bottom))' }}
    >
      {items.map(({ to, icon, labelKey, shortLabelKey }) => (
        <BottomNavItem
          key={to}
          to={to}
          icon={icon}
          label={t(shortLabelKey ?? labelKey)}
          end={to === '/'}
        />
      ))}
    </nav>
  )
}
