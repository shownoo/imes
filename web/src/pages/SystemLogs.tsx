import { useState } from 'react'
import { gql, useQuery } from '@apollo/client'
import { ScrollText, Search } from 'lucide-react'
import { PageHeader, DataTable, Badge, Button, Card, CardContent, TABLE_KEYS } from 'components/common'
import { Input } from 'components/ui/input'
import { LogDetailDialog, hasLogDetail } from 'components/log-detail-dialog'
import { formatDateTime } from 'lib/utils'
import { LOG_ACTION_LABELS, LOG_MODULE_LABELS } from 'lib/system-log-labels'

const GET_LOGS = gql`
  query GetSystemLogs($module: String, $action: String, $input: PaginationInput) {
    getSystemLogs(module: $module, action: $action, input: $input)
  }
`

const ROLE_LABELS: Record<string, string> = {
  ADMIN: '管理员',
  SUPERVISOR: '主管',
  WAREHOUSE_KEEPER: '仓管',
  VIEWER: '查看',
}

export default function SystemLogs() {
  const [module, setModule] = useState('')
  const [action, setAction] = useState('')
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [detailLog, setDetailLog] = useState<Record<string, unknown> | null>(null)

  const { data, loading, refetch } = useQuery(GET_LOGS, {
    variables: {
      module: module || undefined,
      action: action || undefined,
      input: { search: search || undefined, take: 50 },
    },
  })

  const payload = data?.getSystemLogs as { logs: Array<Record<string, unknown>>; count: number } | undefined
  const logs = payload?.logs ?? []
  const count = payload?.count ?? 0

  return (
    <div>
      <PageHeader
        title='系统日志'
        desc="操作留痕 · 责任可追溯 · 管理员与主管可查看"
        action={
          <Badge variant="secondary" className="gap-1.5 font-normal">
            <ScrollText className="size-3.5" />
            共 {count} 条
          </Badge>
        }
      />

      <Card className="mb-6">
        <CardContent className="flex flex-wrap items-end gap-3 pt-6">
          <div className="min-w-[8rem]">
            <label className="mb-1 block text-xs text-muted-foreground">模块</label>
            <select
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={module}
              onChange={(e) => setModule(e.target.value)}
            >
              <option value="">全部模块</option>
              {Object.entries(LOG_MODULE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <div className="min-w-[8rem]">
            <label className="mb-1 block text-xs text-muted-foreground">操作</label>
            <select
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={action}
              onChange={(e) => setAction(e.target.value)}
            >
              <option value="">全部操作</option>
              {Object.entries(LOG_ACTION_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <div className="relative min-w-[12rem] flex-1">
            <label className="mb-1 block text-xs text-muted-foreground">关键词</label>
            <Search className="absolute bottom-2.5 left-3 size-4 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder='搜索摘要或对象…'
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && setSearch(searchInput.trim())}
            />
          </div>
          <Button
            variant="outline"
            onClick={() => {
              setSearch(searchInput.trim())
              refetch()
            }}
          >
            查询
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              setModule('')
              setAction('')
              setSearch('')
              setSearchInput('')
            }}
          >
            重置
          </Button>
        </CardContent>
      </Card>

      <DataTable
        tableKey={TABLE_KEYS.SYSTEM_LOGS}
        loading={loading}
        columns={[
          {
            key: 'createdAt',
            title: '时间',
            render: (r) => (
              <span className="whitespace-nowrap text-xs">{formatDateTime(String(r.createdAt))}</span>
            ),
          },
          {
            key: 'user',
            title: '操作人',
            render: (r) => {
              const user = r.user as {
                name?: string
                username?: string
                role?: { code?: string; name?: string } | string
              } | undefined
              const name = user?.name ?? user?.username ?? '—'
              const roleCode = typeof user?.role === 'object' ? user.role.code : user?.role
              const roleName = typeof user?.role === 'object' ? user.role.name : undefined
              return (
                <div>
                  <p className="text-sm font-medium">{name}</p>
                  <p className="text-xs text-muted-foreground">
                    {roleName ?? ROLE_LABELS[roleCode ?? ''] ?? roleCode}
                  </p>
                </div>
              )
            },
          },
          {
            key: 'module',
            title: '模块',
            render: (r) => (
              <Badge variant="outline">{LOG_MODULE_LABELS[String(r.module)] ?? String(r.module)}</Badge>
            ),
          },
          {
            key: 'action',
            title: '操作',
            render: (r) => (
              <Badge variant="info">{LOG_ACTION_LABELS[String(r.action)] ?? String(r.action)}</Badge>
            ),
          },
          { key: 'summary', title: '摘要' },
          {
            key: 'targetLabel',
            title: '对象',
            render: (r) => (
              <span className="font-mono text-xs text-muted-foreground">
                {String(r.targetLabel ?? '—')}
              </span>
            ),
          },
          {
            key: 'detail',
            title: '详情',
            render: (r) => (
              hasLogDetail(r) ? (
                <Button variant="ghost" size="sm" className="h-7 text-gold" onClick={() => setDetailLog(r)}>
                  查看变更</Button>
              ) : (
                <span className="text-xs text-muted-foreground">—</span>
              )
            ),
          },
          {
            key: 'ipAddress',
            title: 'IP',
            render: (r) => (
              <span className="text-xs text-muted-foreground">{String(r.ipAddress ?? '—')}</span>
            ),
          },
        ]}
        rows={logs}
      />

      <LogDetailDialog
        open={detailLog != null}
        onOpenChange={(open) => !open && setDetailLog(null)}
        log={detailLog}
      />
    </div>
  )
}
