import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery } from '@apollo/client'
import { MobileOpsCrumbBar } from 'components/mobile-ops-crumb-bar'
import { MobileOpsTaskSkeleton } from 'components/mobile-ops-task-skeleton'
import { PullToRefresh } from 'components/pull-to-refresh'
import { Button } from 'components/common'
import { ACKNOWLEDGE_ALERT, GET_MOBILE_ALERTS } from './queries'
import { MOBILE_OPS_ME } from 'lib/mobile-ops'
import { formatDate, ALERT_LEVEL } from 'lib/utils'
import { useTranslation } from 'react-i18next'

const TYPE_LABELS: Record<string, string> = {
  EXPIRY: '效期',
  LOW_STOCK: '低库存',
  HIGH_STOCK: '高库存',
}

export default function OpsMobileAlerts() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { data, loading, refetch } = useQuery(GET_MOBILE_ALERTS, {
    variables: { resolved: false, take: 50 },
  })

  const [ack, { loading: acking }] = useMutation(ACKNOWLEDGE_ALERT, {
    onCompleted: () => void refetch(),
  })

  const result = data?.getAlerts as { alerts: Array<Record<string, unknown>>; count: number } | undefined
  const alerts = result?.alerts ?? []
  const initialLoading = loading && !data

  return (
    <div className="mobile-ops-page">
      <MobileOpsCrumbBar title={t('预警待办')} onBack={() => navigate(MOBILE_OPS_ME)} backLabel={t('我的')} />
      <PullToRefresh onRefresh={() => refetch()}>
        <div className="mobile-ops-page-body space-y-2">
          {initialLoading && <MobileOpsTaskSkeleton />}

          {!initialLoading && alerts.length === 0 && (
            <div className="mobile-ops-empty">{t('暂无待处理预警')}</div>
          )}

          {!initialLoading &&
            alerts.map((alert) => {
              const level = String(alert.level)
              const lv = ALERT_LEVEL[level as keyof typeof ALERT_LEVEL]
              return (
                <div key={String(alert.id)} className="mobile-ops-card px-3.5 py-3">
                  <div className="flex items-start gap-2">
                    <span className={`mt-1 size-2.5 shrink-0 rounded-full ${lv?.color ?? 'bg-muted'}`} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[11px] font-medium text-muted-foreground">
                          {TYPE_LABELS[String(alert.type)] ?? String(alert.type)}
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          {formatDate(String(alert.createdAt))}
                        </span>
                      </div>
                      <p className="mt-1 text-sm leading-snug">{String(alert.message)}</p>
                      {(alert.material as { name?: string })?.name && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          {(alert.material as { name?: string }).name}
                        </p>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3 h-8 w-full"
                    disabled={acking}
                    onClick={() => ack({ variables: { id: alert.id } })}
                  >
                    标记已处理
                  </Button>
                </div>
              )
            })}
        </div>
      </PullToRefresh>
    </div>
  )
}
