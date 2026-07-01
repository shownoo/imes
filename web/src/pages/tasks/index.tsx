import { useNavigate, useSearchParams } from 'react-router-dom'
import { useMutation, useQuery } from '@apollo/client'
import { CheckCircle2, ExternalLink, XCircle } from 'lucide-react'
import { PageHeader, Button, Badge, Card, CardContent, DataTable, ToolbarButton, TABLE_KEYS } from 'components/common'
import { Tabs, TabsContent, TabsList, TabsTrigger } from 'components/ui/tabs'
import { formatDate, STATUS_LABELS, statusBadgeVariant } from 'lib/utils'
import { getRoleLabel } from 'lib/auth'
import type { ApprovalInboxItem } from 'lib/approval-flow'
import {
  activeDocumentPath,
  parseTaskCenterTab,
  type ActiveDocument,
  type SubmittedApprovalItem,
  type TaskCenterTab,
  type WorkbenchSummary,
} from 'lib/workbench'
import { DesktopNotifyToggle } from 'hooks/use-approval-desktop-notify'
import { COMPLETE_TASK, GET_WORKBENCH } from './queries'

function TabCount({ count }: { count: number }) {
  if (count <= 0) return null
  return (
    <Badge variant="destructive" className="ml-1.5 h-5 min-w-5 px-1.5 text-[10px]">
      {count > 99 ? '99+' : count}
    </Badge>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <Card>
      <CardContent className="py-12 text-center text-sm text-muted-foreground">{message}</CardContent>
    </Card>
  )
}

export default function TasksIndex() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const tab = parseTaskCenterTab(searchParams.get('tab'))

  const { data, loading, refetch } = useQuery(GET_WORKBENCH, {
    variables: { take: 50 },
    pollInterval: 30_000,
  })
  const [completeTask] = useMutation(COMPLETE_TASK)

  const workbench = data?.getWorkbench as WorkbenchSummary | undefined
  const counts = workbench?.counts ?? { myApprovals: 0, mySubmitted: 0, activeDocuments: 0 }
  const approvals = workbench?.myApprovals ?? []
  const submitted = workbench?.mySubmitted ?? []
  const documents = workbench?.activeDocuments ?? []

  const setTab = (next: TaskCenterTab) => {
    setSearchParams(next === 'approvals' ? {} : { tab: next }, { replace: true })
  }

  const handleAction = async (task: ApprovalInboxItem, action: 'approved' | 'rejected') => {
    let comment: string | undefined
    if (action === 'rejected') {
      comment = window.prompt('驳回原因（可选）') ?? undefined
      if (comment === null) return
    }
    try {
      await completeTask({
        variables: { input: { taskId: task.taskId, action, comment } },
        refetchQueries: ['GetWorkbench', 'GetApprovalInboxCount', 'Dashboard'],
      })
      refetch()
    } catch (e) {
      alert(e instanceof Error ? e.message : '操作失败')
    }
  }

  return (
    <div>
      <PageHeader
        title="待办中心"
        desc="个人审批、我发起的流程与进行中业务单据统一处理"
        action={
          <div className="flex items-center gap-3">
            <DesktopNotifyToggle />
            <ToolbarButton onClick={() => refetch()}>刷新</ToolbarButton>
          </div>
        }
      />

      <Tabs value={tab} onValueChange={(v) => setTab(parseTaskCenterTab(v))}>
        <TabsList className="h-auto flex-wrap">
          <TabsTrigger value="approvals" className="gap-0">
            待我审批
            <TabCount count={counts.myApprovals} />
          </TabsTrigger>
          <TabsTrigger value="submitted" className="gap-0">
            我发起的
            <TabCount count={counts.mySubmitted} />
          </TabsTrigger>
          <TabsTrigger value="documents" className="gap-0">
            进行中单据
            <TabCount count={counts.activeDocuments} />
          </TabsTrigger>
        </TabsList>

        <TabsContent value="approvals">
          {approvals.length === 0 && !loading ? (
            <EmptyState message="暂无待审批任务" />
          ) : (
            <DataTable
              tableKey={TABLE_KEYS.TASKS_APPROVALS}
              loading={loading}
              columns={[
                { key: 'bizLabel', title: '类型', render: (r) => <Badge variant="info">{String(r.bizLabel)}</Badge> },
                { key: 'orderNo', title: '单号' },
                { key: 'nodeLabel', title: '当前节点', render: (r) => String(r.nodeLabel ?? '审批') },
                { key: 'summary', title: '摘要' },
                { key: 'submitter', title: '提交人' },
                { key: 'dueAt', title: '截止时间', render: (r) => (r.dueAt ? formatDate(String(r.dueAt)) : '—') },
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
              rows={approvals as unknown as Array<Record<string, unknown>>}
            />
          )}
        </TabsContent>

        <TabsContent value="submitted">
          {submitted.length === 0 && !loading ? (
            <EmptyState message="暂无审批中的申请" />
          ) : (
            <DataTable
              tableKey={TABLE_KEYS.TASKS_SUBMITTED}
              loading={loading}
              columns={[
                { key: 'bizLabel', title: '类型', render: (r) => <Badge variant="info">{String(r.bizLabel)}</Badge> },
                { key: 'orderNo', title: '单号' },
                { key: 'summary', title: '摘要' },
                { key: 'currentNodeLabel', title: '当前节点' },
                {
                  key: 'waitingRole',
                  title: '待谁处理',
                  render: (r) => {
                    const role = (r as SubmittedApprovalItem).waitingRole
                    return role ? getRoleLabel(role) : '—'
                  },
                },
                { key: 'submittedAt', title: '提交时间', render: (r) => formatDate(String(r.submittedAt)) },
                { key: 'updatedAt', title: '最近更新', render: (r) => formatDate(String(r.updatedAt)) },
                {
                  key: 'actions',
                  title: '操作',
                  render: (r) => {
                    const item = r as SubmittedApprovalItem
                    return (
                      <Button variant="ghost" size="sm" className="h-8 px-2" onClick={() => navigate(item.docPath)}>
                        <ExternalLink className="size-3.5" /> 查看进度
                      </Button>
                    )
                  },
                },
              ]}
              rows={submitted as unknown as Array<Record<string, unknown>>}
            />
          )}
        </TabsContent>

        <TabsContent value="documents">
          {documents.length === 0 && !loading ? (
            <EmptyState message="暂无进行中单据" />
          ) : (
            <DataTable
              tableKey={TABLE_KEYS.TASKS_DOCUMENTS}
              loading={loading}
              columns={[
                { key: 'docType', title: '类型', render: (r) => <Badge variant="info">{String(r.docType)}</Badge> },
                { key: 'orderNo', title: '单号' },
                {
                  key: 'status',
                  title: '状态',
                  render: (r) => (
                    <Badge variant={statusBadgeVariant(String(r.status))}>
                      {STATUS_LABELS[String(r.status)] ?? String(r.status)}
                    </Badge>
                  ),
                },
                { key: 'partner', title: '供应商/目的地' },
                { key: 'createdBy', title: '创建人', render: (r) => String(r.createdBy ?? '—') },
                { key: 'createdAt', title: '时间', render: (r) => formatDate(String(r.createdAt)) },
                {
                  key: 'actions',
                  title: '操作',
                  render: (r) => (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2"
                      onClick={() => navigate(activeDocumentPath(r as unknown as ActiveDocument))}
                    >
                      <ExternalLink className="size-3.5" /> 查看
                    </Button>
                  ),
                },
              ]}
              rows={documents as unknown as Array<Record<string, unknown>>}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
