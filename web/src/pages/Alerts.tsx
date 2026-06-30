import { gql, useQuery, useMutation } from '@apollo/client'
import { RefreshCw } from 'lucide-react'
import { PageHeader, DataTable, Button, Card, CardContent, PageActionButton } from 'components/common'
import { Tooltip, TooltipContent, TooltipTrigger } from 'components/ui/tooltip'
import { formatDate, ALERT_LEVEL } from 'lib/utils'

const GET_ALERTS = gql`query GetAlerts($resolved: Boolean, $take: Int) { getAlerts(resolved: $resolved, take: $take) }`
const SYNC = gql`mutation SyncAlerts { syncAlerts }`
const RESOLVE = gql`mutation ResolveAlert($id: ID!) { resolveAlert(id: $id) }`

const TYPE_LABELS: Record<string, string> = { EXPIRY: '效期预警', LOW_STOCK: '低库存', HIGH_STOCK: '高库存' }

const LEVEL_TIPS: Record<string, string> = {
  GREEN: '效期充足，无预警',
  YELLOW: '临期预警：距到期不足 3 个月',
  RED: '强烈预警：距到期不足 1 个月',
}

export default function Alerts() {
  const { data, loading, refetch } = useQuery(GET_ALERTS, { variables: { resolved: false, take: 50 } })
  const [sync, { loading: syncing }] = useMutation(SYNC, { onCompleted: () => refetch() })
  const [resolve] = useMutation(RESOLVE, { onCompleted: () => refetch() })

  const alerts = (data?.getAlerts as { alerts: Array<Record<string, unknown>> })?.alerts ?? []

  return (
    <div>
      <PageHeader
        title="智能预警"
        titleTip="效期红绿灯 · 库存水位线 · FIFO 优先"
        action={
          <Tooltip>
            <TooltipTrigger asChild>
              <span>
                <PageActionButton onClick={() => sync()} disabled={syncing}>
                  <RefreshCw className={`size-3.5 ${syncing ? 'animate-spin' : ''}`} />
                  同步预警
                </PageActionButton>
              </span>
            </TooltipTrigger>
            <TooltipContent side="bottom">重新扫描库存，生成最新效期与水位预警</TooltipContent>
          </Tooltip>
        }
      />
      <div className="mb-6 grid grid-cols-3 gap-4">
        {(['GREEN', 'YELLOW', 'RED'] as const).map((level) => {
          const lv = ALERT_LEVEL[level]
          return (
            <Tooltip key={level}>
              <TooltipTrigger asChild>
                <Card className="cursor-help transition-colors hover:bg-muted/20">
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
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-[14rem] leading-relaxed">
                {LEVEL_TIPS[level]}
              </TooltipContent>
            </Tooltip>
          )
        })}
      </div>

      <DataTable loading={loading} columns={[
        { key: 'level', title: '级别', tip: '效期红绿灯：绿安全 / 黄临期 / 红预警', render: (r) => {
          const lv = ALERT_LEVEL[String(r.level)] ?? { label: String(r.level), color: 'bg-muted' }
          return <span className="flex items-center gap-2"><span className={`size-2.5 rounded-full ${lv.color}`} />{lv.label}</span>
        }},
        { key: 'type', title: '类型', tip: '预警类型：效期、低库存或高库存', render: (r) => TYPE_LABELS[String(r.type)] ?? String(r.type) },
        { key: 'message', title: '预警内容', tip: '具体预警描述' },
        { key: 'material', title: '物资', tip: '触发预警的物资', render: (r) => (r.material as { name?: string })?.name ?? '—' },
        { key: 'createdAt', title: '时间', tip: '预警生成时间', render: (r) => formatDate(String(r.createdAt)) },
        { key: 'action', title: '操作', render: (r) => (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 text-gold" onClick={() => resolve({ variables: { id: r.id } })}>标记已处理</Button>
            </TooltipTrigger>
            <TooltipContent>确认已关注并处理该预警</TooltipContent>
          </Tooltip>
        )},
      ]} rows={alerts} />
    </div>
  )
}
