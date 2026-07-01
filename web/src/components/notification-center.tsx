import type { ElementType } from 'react'
import { gql, useQuery } from '@apollo/client'
import { useNavigate } from 'react-router-dom'
import { Bell, ClipboardCheck, AlertTriangle } from 'lucide-react'
import type { ApprovalInboxItem } from 'lib/approval-flow'
import { ALERT_LEVEL, cn, formatDate } from 'lib/utils'
import { GET_INBOX, GET_INBOX_COUNT } from 'pages/tasks/queries'
import { sidebarFooterButtonClass } from 'lib/nav-styles'
import { Tooltip, TooltipContent, TooltipTrigger } from 'components/ui/tooltip'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from 'components/ui/dropdown-menu'

const GET_ALERTS = gql`query GetAlerts($resolved: Boolean, $take: Int) { getAlerts(resolved: $resolved, take: $take) }`

const ALERT_TYPE_LABELS: Record<string, string> = {
  EXPIRY: '效期预警',
  LOW_STOCK: '低库存',
  HIGH_STOCK: '高库存',
}

type AlertRow = {
  id: string
  type: string
  level: string
  message: string
  material?: { name?: string }
  createdAt: string
}

const PREVIEW_LIMIT = 5

function SectionHeader({
  icon: Icon,
  title,
  count,
  onViewAll,
}: {
  icon: ElementType
  title: string
  count: number
  onViewAll: () => void
}) {
  return (
    <div className="flex items-center gap-2 px-2.5 py-1.5">
      <Icon className="size-3.5 shrink-0 text-muted-foreground" />
      <span className="flex-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</span>
      {count > 0 && (
        <span className="rounded-full bg-destructive/10 px-1.5 py-0.5 text-[10px] font-bold text-destructive">
          {count > 99 ? '99+' : count}
        </span>
      )}
      <button
        type="button"
        onClick={onViewAll}
        className="text-[11px] font-medium text-primary hover:underline"
      >全部</button>
    </div>
  )
}

export function NotificationCenter({
  placement = 'header',
  collapsed = false,
}: {
  placement?: 'header' | 'sidebar'
  collapsed?: boolean
}) {
  const navigate = useNavigate()
  const { data: inboxData } = useQuery(GET_INBOX, { pollInterval: 30_000 })
  const { data: countData } = useQuery(GET_INBOX_COUNT, { pollInterval: 30_000 })
  const { data: alertData } = useQuery(GET_ALERTS, {
    variables: { resolved: false, take: PREVIEW_LIMIT },
    pollInterval: 60_000,
  })

  const tasks = ((inboxData?.getMyPendingApprovalTasks ?? []) as ApprovalInboxItem[]).slice(0, PREVIEW_LIMIT)
  const approvalCount = (countData?.getApprovalInboxCount as { count?: number })?.count ?? 0
  const alertPayload = alertData?.getAlerts as { alerts?: AlertRow[]; count?: number } | undefined
  const alerts = alertPayload?.alerts ?? []
  const alertCount = alertPayload?.count ?? alerts.length
  const totalCount = approvalCount + alertCount

  const isSidebar = placement === 'sidebar'

  const sidebarButton = (
    <button
      type="button"
      aria-label="通知中心"
      className={cn(sidebarFooterButtonClass(collapsed), 'relative w-full')}
    >
      <Bell className="size-4 shrink-0" strokeWidth={1.75} />
      {!collapsed && <span className="flex-1 truncate text-left">通知</span>}
      {totalCount > 0 && (
        <span
          className={cn(
            'flex items-center justify-center rounded-full bg-destructive text-[10px] font-semibold tabular-nums text-destructive-foreground',
            collapsed
              ? 'absolute -right-0.5 -top-0.5 size-4'
              : 'ml-auto h-5 min-w-5 rounded-md px-1',
          )}
        >
          {totalCount > 99 ? '99+' : totalCount}
        </span>
      )}
    </button>
  )

  const sidebarTrigger = collapsed ? (
    <Tooltip>
      <TooltipTrigger asChild>
        <DropdownMenuTrigger asChild>{sidebarButton}</DropdownMenuTrigger>
      </TooltipTrigger>
      <TooltipContent side="right">通知</TooltipContent>
    </Tooltip>
  ) : (
    <DropdownMenuTrigger asChild>{sidebarButton}</DropdownMenuTrigger>
  )

  return (
    <DropdownMenu>
      {isSidebar ? (
        sidebarTrigger
      ) : (
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label="通知中心"
            className="relative flex size-9 items-center justify-center rounded-lg transition-colors hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
          >
            <Bell className="size-4 text-muted-foreground" strokeWidth={2} />
            {totalCount > 0 && (
              <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-0.5 text-[9px] font-bold leading-none text-destructive-foreground">
                {totalCount > 99 ? '99+' : totalCount}
              </span>
            )}
          </button>
        </DropdownMenuTrigger>
      )}
      <DropdownMenuContent
        align={isSidebar ? 'start' : 'end'}
        side={isSidebar ? 'top' : 'bottom'}
        className="w-[min(22rem,calc(100vw-2rem))] p-0"
      >
        <DropdownMenuLabel className="border-b px-3 py-2.5 font-normal">
          <p className="text-sm font-medium">通知中心</p>
          <p className="text-xs text-muted-foreground">
            {totalCount > 0 ? `${totalCount} 条未读` : '暂无新通知'}
          </p>
        </DropdownMenuLabel>

        <div className="max-h-[min(60vh,420px)] overflow-y-auto py-1">
          <SectionHeader
            icon={ClipboardCheck}
            title="待我审批"
            count={approvalCount}
            onViewAll={() => navigate('/tasks')}
          />
          {tasks.length === 0 ? (
            <p className="px-3 py-2 text-xs text-muted-foreground">暂无待审批任务</p>
          ) : (
            tasks.map((task) => (
              <DropdownMenuItem
                key={task.taskId}
                className="mx-1 flex-col items-start gap-0.5 px-2.5 py-2"
                onSelect={() => navigate(task.docPath)}
              >
                <span className="flex w-full items-center gap-2">
                  <span className="truncate text-sm font-medium">{task.bizLabel}</span>
                  <span className="ml-auto shrink-0 text-[10px] text-muted-foreground">{task.orderNo}</span>
                </span>
                <span className="line-clamp-1 w-full text-xs text-muted-foreground">{task.summary}</span>
                <span className="text-[10px] text-muted-foreground/80">
                  {task.nodeLabel ?? '审批'} · {formatDate(task.createdAt)}
                </span>
              </DropdownMenuItem>
            ))
          )}

          <DropdownMenuSeparator className="my-1" />

          <SectionHeader
            icon={AlertTriangle}
            title="智能预警"
            count={alertCount}
            onViewAll={() => navigate('/alerts')}
          />
          {alerts.length === 0 ? (
            <p className="px-3 py-2 text-xs text-muted-foreground">暂无未处理预警</p>
          ) : (
            alerts.map((alert) => {
              const lv = ALERT_LEVEL[alert.level] ?? { label: alert.level, color: 'bg-muted' }
              return (
                <DropdownMenuItem
                  key={alert.id}
                  className="mx-1 flex-col items-start gap-0.5 px-2.5 py-2"
                  onSelect={() => navigate('/alerts')}
                >
                  <span className="flex w-full items-center gap-2">
                    <span className={cn('size-2 shrink-0 rounded-full', lv.color)} />
                    <span className="truncate text-sm font-medium">
                      {ALERT_TYPE_LABELS[alert.type] ?? alert.type}
                    </span>
                    <span className="ml-auto shrink-0 text-[10px] text-muted-foreground">{lv.label}</span>
                  </span>
                  <span className="line-clamp-2 w-full text-xs text-muted-foreground">{alert.message}</span>
                  {(alert.material?.name || alert.createdAt) && (
                    <span className="text-[10px] text-muted-foreground/80">
                      {[alert.material?.name, alert.createdAt ? formatDate(alert.createdAt) : null]
                        .filter(Boolean)
                        .join(' · ')}
                    </span>
                  )}
                </DropdownMenuItem>
              )
            })
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
