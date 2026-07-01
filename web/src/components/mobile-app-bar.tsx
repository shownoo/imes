import { Shield } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { NotificationCenter } from 'components/notification-center'
import { SidebarTrigger } from 'components/ui/sidebar'

export function MobileAppBar() {
  const { t } = useTranslation()

  return (
    <header className="flex h-12 shrink-0 items-center gap-2 border-b bg-card/95 px-3 backdrop-blur-sm">
      <SidebarTrigger className="size-8 shrink-0" />
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary shadow-sm">
          <Shield className="size-3.5 text-primary-foreground" />
        </div>
        <p className="truncate text-sm font-semibold leading-tight">
          IMES
          <span className="ml-1 text-xs font-normal text-muted-foreground">{t('应急物资智能管理')}</span>
        </p>
      </div>
      <NotificationCenter />
    </header>
  )
}
