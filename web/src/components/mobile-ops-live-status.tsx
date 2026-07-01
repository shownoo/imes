import { cn } from 'lib/utils'
import { useTranslation } from 'react-i18next'

export function MobileOpsLiveStatus({
  syncing,
  minimal,
}: {
  syncing?: boolean
  /** 仅同步时显示轻量指示，不常驻文案 */
  minimal?: boolean
}) {
  const { t } = useTranslation()
  if (minimal && !syncing) return null

  if (minimal) {
    return (
      <span className="mobile-ops-sync-pill" role="status" aria-live="polite">
        <span className="mobile-ops-sync-dot mobile-ops-sync-dot--active" aria-hidden />{t('同步中')}</span>
    )
  }

  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
      <span
        className={cn(
          'size-1.5 shrink-0 rounded-full',
          syncing ? 'animate-pulse bg-primary' : 'bg-emerald-500',
        )}
        aria-hidden
      />
      {syncing ? '同步中…' : '实时协同'}
    </span>
  )
}
