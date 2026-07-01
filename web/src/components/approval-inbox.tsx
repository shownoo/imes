import { NavLink } from 'react-router-dom'
import { useQuery } from '@apollo/client'
import { ClipboardCheck } from 'lucide-react'
import { useWorkMode } from 'contexts/work-mode-context'
import { shouldShowApprovalInbox } from 'lib/work-mode'
import { GET_INBOX_COUNT } from 'pages/tasks/queries'
import { cn } from 'lib/utils'
import { useTranslation } from 'react-i18next'

export function ApprovalInboxNavItem({
  className,
  compact,
}: {
  className?: string
  compact?: boolean
}) {
  const { t } = useTranslation()
  const { data } = useQuery(GET_INBOX_COUNT, { pollInterval: 30_000 })
  const count = (data?.getApprovalInboxCount as { count?: number })?.count ?? 0

  return (
      <NavLink to="/tasks" className={className} title={t('待办中心')}>
      <ClipboardCheck className="size-4 shrink-0 opacity-80" strokeWidth={1.75} />
      <span className={cn('truncate', compact ? undefined : 'flex-1')}>{t('待办中心')}</span>
      {count > 0 && (
        <span className="ml-auto flex h-5 min-w-5 shrink-0 items-center justify-center rounded-md bg-destructive px-1 text-[10px] font-semibold tabular-nums text-destructive-foreground">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </NavLink>
  )
}

export function ApprovalReminderBanner() {
  const { t } = useTranslation()
  const { mode } = useWorkMode()
  const { data } = useQuery(GET_INBOX_COUNT, { pollInterval: 30_000 })
  const count = (data?.getApprovalInboxCount as { count?: number })?.count ?? 0
  if (!shouldShowApprovalInbox(mode) || count <= 0) return null

  return (
    <div className="mb-4 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-sm">{t('您有')}<strong>{count}</strong>{t('条待审批任务，')}<NavLink to="/tasks" className="font-medium text-primary hover:underline">{t('前往待办中心')}</NavLink>
    </div>
  )
}
