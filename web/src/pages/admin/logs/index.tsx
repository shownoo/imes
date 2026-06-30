import { useState } from 'react'
import { useQuery } from '@apollo/client'
import { Search } from 'lucide-react'
import { DataTable, Badge, Button } from 'components/common'
import { DebounceInput } from 'components/debounce-input'
import { ListToolbar, SearchInputShell } from 'components/section-menu'
import { LogDetailDialog, hasLogDetail } from 'components/log-detail-dialog'
import { GET_SYSTEM_LOGS } from '../queries'

const MODULE_LABELS: Record<string, string> = {
  AUTH: '认证',
  USER: '用户',
  ROLE: '角色',
  MATERIAL: '物资',
  CATEGORY: '大类',
  SUPPLIER: '供应商',
  WAREHOUSE: '库区',
  INBOUND: '入库',
  OUTBOUND: '出库',
  STOCK: '库存',
  ALERT: '预警',
}

const ACTION_LABELS: Record<string, string> = {
  LOGIN: '登录',
  CREATE: '创建',
  UPDATE: '更新',
  DELETE: '删除',
  SUBMIT: '提交',
  APPROVE: '审核',
  REJECT: '驳回',
  RECEIVE: '收货',
  SHELVE: '上架',
  COMPLETE: '完成',
  PICK: '拣货',
  SHIP: '发货',
  SYNC: '同步',
  RESOLVE: '处理',
}

function formatTime(value: unknown) {
  if (!value) return '—'
  return new Date(String(value)).toLocaleString('zh-CN')
}

export default function LogsIndex() {
  const [search, setSearch] = useState('')
  const [detailLog, setDetailLog] = useState<Record<string, unknown> | null>(null)

  const { data, loading } = useQuery(GET_SYSTEM_LOGS, {
    variables: { input: { search: search || undefined, take: 50 } },
  })

  const logs = (data?.getSystemLogs as { logs: Array<Record<string, unknown>> })?.logs ?? []

  return (
    <div>
      <ListToolbar
        className="mb-4"
        search={
          <SearchInputShell>
            <Search className="absolute left-3 top-1/2 z-10 size-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <DebounceInput
              className="pl-9"
              placeholder="搜索摘要或目标..."
              defaultValue={search}
              debounceTime={500}
              onSearch={setSearch}
            />
          </SearchInputShell>
        }
      />

      <DataTable
        loading={loading}
        columns={[
          { key: 'createdAt', title: '时间', render: (r) => formatTime(r.createdAt) },
          {
            key: 'user',
            title: '操作人',
            render: (r) => {
              const u = r.user as { name?: string; username?: string } | undefined
              return u?.name ?? u?.username ?? '—'
            },
          },
          {
            key: 'module',
            title: '模块',
            render: (r) => (
              <Badge variant="secondary">{MODULE_LABELS[String(r.module)] ?? String(r.module)}</Badge>
            ),
          },
          {
            key: 'action',
            title: '操作',
            render: (r) => ACTION_LABELS[String(r.action)] ?? String(r.action),
          },
          { key: 'summary', title: '摘要' },
          { key: 'targetLabel', title: '目标', render: (r) => String(r.targetLabel ?? '—') },
          {
            key: 'detail',
            title: '变更',
            render: (r) =>
              hasLogDetail(r) ? (
                <Button variant="ghost" size="sm" className="h-7 text-gold" onClick={() => setDetailLog(r)}>
                  查看
                </Button>
              ) : (
                <span className="text-xs text-muted-foreground">—</span>
              ),
          },
          { key: 'ipAddress', title: 'IP', render: (r) => String(r.ipAddress ?? '—') },
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
