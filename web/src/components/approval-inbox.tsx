import { NavLink } from 'react-router-dom'
import { useQuery } from '@apollo/client'
import { ClipboardCheck } from 'lucide-react'
import { GET_INBOX_COUNT } from 'pages/tasks/queries'

export function ApprovalInboxNavItem({ className }: { className?: string }) {
  const { data } = useQuery(GET_INBOX_COUNT, { pollInterval: 30_000 })
  const count = (data?.getApprovalInboxCount as { count?: number })?.count ?? 0

  return (
    <NavLink to="/tasks" className={className} title="我的待办">
      <ClipboardCheck />
      <span>我的待办</span>
      {count > 0 && (
        <span className="ml-0.5 flex h-4 min-w-4 shrink-0 items-center justify-center rounded-full bg-destructive px-0.5 text-[9px] font-bold text-destructive-foreground">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </NavLink>
  )
}

export function ApprovalReminderBanner() {
  const { data } = useQuery(GET_INBOX_COUNT, { pollInterval: 30_000 })
  const count = (data?.getApprovalInboxCount as { count?: number })?.count ?? 0
  if (count <= 0) return null

  return (
    <div className="mb-4 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-sm">
      您有 <strong>{count}</strong> 条待审批任务，
      <NavLink to="/tasks" className="font-medium text-primary hover:underline">立即处理</NavLink>
    </div>
  )
}
