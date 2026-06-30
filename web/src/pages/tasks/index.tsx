import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery } from '@apollo/client'
import { CheckCircle2, ExternalLink, XCircle } from 'lucide-react'
import { PageHeader, Button, Badge, Card, CardContent, DataTable, ToolbarButton } from 'components/common'
import { formatDate } from 'lib/utils'
import type { ApprovalInboxItem } from 'lib/approval-flow'
import { DesktopNotifyToggle } from 'hooks/use-approval-desktop-notify'
import { COMPLETE_TASK, GET_INBOX } from './queries'

export default function TasksIndex() {
  const navigate = useNavigate()
  const { data, loading, refetch } = useQuery(GET_INBOX, { pollInterval: 30_000 })
  const [completeTask] = useMutation(COMPLETE_TASK)

  const tasks = (data?.getMyPendingApprovalTasks ?? []) as ApprovalInboxItem[]

  const handleAction = async (task: ApprovalInboxItem, action: 'approved' | 'rejected') => {
    let comment: string | undefined
    if (action === 'rejected') {
      comment = window.prompt('驳回原因（可选）') ?? undefined
      if (comment === null) return
    }
    try {
      await completeTask({
        variables: { input: { taskId: task.taskId, action, comment } },
        refetchQueries: ['GetMyPendingApprovalTasks', 'GetApprovalInboxCount', 'Dashboard'],
      })
      refetch()
    } catch (e) {
      alert(e instanceof Error ? e.message : '操作失败')
    }
  }

  return (
    <div>
      <PageHeader
        title="我的待办"
        desc="待您审批的单据会出现在这里；主管初审通过后，管理员会收到复核待办"
        action={
          <div className="flex items-center gap-3">
            <DesktopNotifyToggle />
            <ToolbarButton onClick={() => refetch()}>刷新</ToolbarButton>
          </div>
        }
      />

      {tasks.length === 0 && !loading && (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            暂无待审批任务
          </CardContent>
        </Card>
      )}

      <DataTable
        loading={loading}
        columns={[
          { key: 'bizLabel', title: '类型', render: (r) => <Badge variant="info">{String(r.bizLabel)}</Badge> },
          { key: 'orderNo', title: '单号' },
          { key: 'nodeLabel', title: '当前节点', render: (r) => String(r.nodeLabel ?? '审批') },
          { key: 'summary', title: '摘要' },
          { key: 'submitter', title: '提交人' },
          { key: 'dueAt', title: '截止时间', render: (r) => r.dueAt ? formatDate(String(r.dueAt)) : '—' },
          { key: 'createdAt', title: '到达时间', render: (r) => formatDate(String(r.createdAt)) },
          {
            key: 'actions',
            title: '操作',
            render: (r) => {
              const task = r as ApprovalInboxItem
              return (
                <div className="flex flex-wrap items-center gap-1">
                  <Button variant="ghost" size="sm" className="h-8 px-2" onClick={() => navigate(task.docPath)}>
                    <ExternalLink className="size-3.5" /> 查看
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 px-2 text-emerald-600" onClick={() => handleAction(task, 'approved')}>
                    <CheckCircle2 className="size-3.5" /> 通过
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 px-2 text-destructive" onClick={() => handleAction(task, 'rejected')}>
                    <XCircle className="size-3.5" /> 驳回
                  </Button>
                </div>
              )
            },
          },
        ]}
        rows={tasks as unknown as Array<Record<string, unknown>>}
      />
    </div>
  )
}
