import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@apollo/client'
import { MobileOpsCrumbBar } from 'components/mobile-ops-crumb-bar'
import { MobileOpsTaskSkeleton } from 'components/mobile-ops-task-skeleton'
import { PullToRefresh } from 'components/pull-to-refresh'
import { QrScanInput } from 'components/qr-scan-input'
import { Badge } from 'components/common'
import { GET_EXPIRING_STOCK_ITEMS } from './queries'
import { MOBILE_OPS_ME } from 'lib/mobile-ops'
import { formatDate, ALERT_LEVEL } from 'lib/utils'
import { cn } from 'lib/utils'
import { useTranslation } from 'react-i18next'

type ExpiryItem = Record<string, unknown>

const LEVEL_FILTERS = [
  { value: 'all', label: '全部临期' },
  { value: 'RED', label: '强烈预警' },
  { value: 'YELLOW', label: '临期预警' },
]

export default function OpsMobileExpiry() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [level, setLevel] = useState('all')
  const [qrCode, setQrCode] = useState('')
  const [highlightQr, setHighlightQr] = useState<string | null>(null)

  const { data, loading, refetch } = useQuery(GET_EXPIRING_STOCK_ITEMS, {
    variables: {
      level: level === 'all' ? undefined : level,
      take: 80,
    },
  })

  const result = data?.getExpiringStockItems as
    | { items: ExpiryItem[]; count: number; redCount: number; yellowCount: number }
    | undefined
  const items = result?.items ?? []
  const initialLoading = loading && !data

  const scanItem = items.find((i) => String(i.qrCode) === qrCode.trim())

  return (
    <div className="mobile-ops-page">
      <MobileOpsCrumbBar title={t('效期巡检')} onBack={() => navigate(MOBILE_OPS_ME)} backLabel={t('我的')} />
      <PullToRefresh onRefresh={() => refetch()}>
        <div className="mobile-ops-page-body space-y-4">
          <section className="mobile-ops-card space-y-3">
            <h2 className="text-sm font-semibold">{t('扫码核查')}</h2>
            <QrScanInput
              value={qrCode}
              onChange={setQrCode}
              onSubmit={(qr) => {
                setHighlightQr(qr)
                setQrCode(qr)
              }}
              submitLabel="核查"
              placeholder={t('扫描临期物资二维码')}
            />
            {qrCode.trim() && !scanItem && !initialLoading && (
              <p className="text-xs text-muted-foreground">{t('该码不在当前临期清单中，或效期正常')}</p>
            )}
            {scanItem && (
              <div className="rounded-lg border border-primary/25 bg-primary/5 p-3 text-sm">
                <p className="font-medium">{(scanItem.material as { name?: string })?.name}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  到期 {formatDate(String((scanItem.batch as { expiryDate?: string })?.expiryDate))}
                </p>
              </div>
            )}
          </section>

          <div className="flex gap-2">
            {LEVEL_FILTERS.map((f) => (
              <button
                key={f.value}
                type="button"
                onClick={() => setLevel(f.value)}
                className={cn(
                  'flex-1 rounded-lg border py-2 text-center text-xs font-medium transition-colors',
                  level === f.value
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border/60 text-muted-foreground',
                )}
              >
                {f.label}
              </button>
            ))}
          </div>

          {!initialLoading && (
            <p className="px-0.5 text-xs text-muted-foreground">
              共 {result?.count ?? 0} 项 · 红 {result?.redCount ?? 0} · 黄 {result?.yellowCount ?? 0}
            </p>
          )}

          {initialLoading && <MobileOpsTaskSkeleton />}

          {!initialLoading && items.length === 0 && (
            <div className="mobile-ops-empty">{t('暂无临期物资')}</div>
          )}

          {!initialLoading &&
            items.map((item) => {
              const expiryLevel = String(item.expiryLevel)
              const lv = ALERT_LEVEL[expiryLevel as keyof typeof ALERT_LEVEL]
              const isHighlight = highlightQr === String(item.qrCode)
              return (
                <div
                  key={String(item.id)}
                  className={cn(
                    'mobile-ops-card px-3.5 py-3',
                    isHighlight && 'ring-1 ring-primary/40',
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{(item.material as { name?: string })?.name}</p>
                      <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">{String(item.qrCode)}</p>
                    </div>
                    <Badge variant={expiryLevel === 'RED' ? 'destructive' : 'secondary'}>
                      {lv?.label ?? expiryLevel}
                    </Badge>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    到期 {formatDate(String((item.batch as { expiryDate?: string })?.expiryDate))}
                    {' · '}
                    货位 {(item.shelf as { code?: string })?.code ?? '未上架'}
                    {' · '}
                    数量 {String(item.quantity)}
                  </p>
                </div>
              )
            })}
        </div>
      </PullToRefresh>
    </div>
  )
}
