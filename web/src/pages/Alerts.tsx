import { gql, useQuery, useMutation } from '@apollo/client'
import { RefreshCw } from 'lucide-react'
import { PageHeader, DataTable, Badge, Button, Card, CardContent } from 'components/common'
import { formatDate, ALERT_LEVEL } from 'lib/utils'

const GET_ALERTS = gql`query GetAlerts($resolved: Boolean, $take: Int) { getAlerts(resolved: $resolved, take: $take) }`
const SYNC = gql`mutation SyncAlerts { syncAlerts }`
const RESOLVE = gql`mutation ResolveAlert($id: ID!) { resolveAlert(id: $id) }`

const TYPE_LABELS: Record<string, string> = { EXPIRY: '效期预警', LOW_STOCK: '低库存', HIGH_STOCK: '高库存' }

export default function Alerts() {
  const { data, loading, refetch } = useQuery(GET_ALERTS, { variables: { resolved: false, take: 50 } })
  const [sync, { loading: syncing }] = useMutation(SYNC, { onCompleted: () => refetch() })
  const [resolve] = useMutation(RESOLVE, { onCompleted: () => refetch() })

  const alerts = (data?.getAlerts as { alerts: Array<Record<string, unknown>> })?.alerts ?? []

  return (
    <div>
      <PageHeader title='智能预警' desc="效期红绿灯 · 库存水位线 · FIFO优先"
        action={<Button onClick={() => sync()} disabled={syncing}><RefreshCw className={`size-4 ${syncing ? 'animate-spin' : ''}`} />同步预警</Button>} />

      <div className="mb-6 grid grid-cols-3 gap-4">
        {(['GREEN', 'YELLOW', 'RED'] as const).map((level) => {
          const lv = ALERT_LEVEL[level]
          return (
            <Card key={level}>
              <CardContent className="flex items-center gap-4 pt-6">
                <span className={`size-4 rounded-full ${lv.color}`} />
                <div>
                  <p className="font-medium">{lv.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {level === 'GREEN' && '安全状态'}{level === 'YELLOW' && '临期预警（3个月）'}{level === 'RED' && '强烈预警（1个月）'}
                  </p>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <DataTable loading={loading} columns={[
        { key: 'level', title: '级别', render: (r) => {
          const lv = ALERT_LEVEL[String(r.level)] ?? { label: String(r.level), color: 'bg-muted' }
          return <span className="flex items-center gap-2"><span className={`size-2.5 rounded-full ${lv.color}`} />{lv.label}</span>
        }},
        { key: 'type', title: '类型', render: (r) => TYPE_LABELS[String(r.type)] ?? String(r.type) },
        { key: 'message', title: '预警内容' },
        { key: 'material', title: '物资', render: (r) => (r.material as { name?: string })?.name ?? '—' },
        { key: 'createdAt', title: '时间', render: (r) => formatDate(String(r.createdAt)) },
        { key: 'action', title: '操作', render: (r) => (
          <Button variant="ghost" size="sm" className="h-7 text-gold" onClick={() => resolve({ variables: { id: r.id } })}>标记已处理</Button>
        )},
      ]} rows={alerts} />
    </div>
  )
}
