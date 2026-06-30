import type { ReactNode } from 'react'
import { cn } from 'lib/utils'

/** 页面内容区 — 间距与栅格随「我的空间」--leader-grid-gap / --leader-content-max */
export function WorkspacePageShell({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return <div className={cn('leader-workspace-grid w-full space-y-6', className)}>{children}</div>
}
