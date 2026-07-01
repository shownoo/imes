import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { gql, useLazyQuery } from '@apollo/client'
import { ScanLine } from 'lucide-react'
import { Badge } from 'components/common'
import { MobileOpsCrumbBar } from 'components/mobile-ops-crumb-bar'
import { QrScanInput } from 'components/qr-scan-input'
import { MovementTypeBadge } from 'components/movement-type-badge'
import { STATUS_LABELS, formatDateTime } from 'lib/utils'
import { useTranslation } from 'react-i18next'

const TRACE = gql`query TraceMaterial($qrCode: String!) { traceMaterial(qrCode: $qrCode) }`

export default function OpsMobileScan() {
  const { t } = useTranslation()
  const [params] = useSearchParams()
  const initialQr = params.get('qr') ?? ''
  const [qrCode, setQrCode] = useState(initialQr)
  const [trace, { data, loading }] = useLazyQuery(TRACE)
  const item = data?.traceMaterial as Record<string, unknown> | null | undefined
  const showIdleTip = !data && !loading

  useEffect(() => {
    if (initialQr.trim()) trace({ variables: { qrCode: initialQr.trim() } })
  }, [initialQr, trace])

  return (
    <div className="mobile-ops-page mobile-ops-page--tab-root mobile-ops-page--scan">
      <MobileOpsCrumbBar title={t('扫码')} />
      <div className="mobile-ops-page-body space-y-4">
        <div className="mobile-ops-card">
          <QrScanInput
            value={qrCode}
            onChange={setQrCode}
            onSubmit={(qr) => trace({ variables: { qrCode: qr } })}
            submitLabel="查询"
            disabled={loading}
            placeholder={t('扫描或输入物资二维码')}
          />
        </div>

        {showIdleTip && (
          <div className="mobile-ops-empty-state" role="status">
            <div className="mobile-ops-empty-state-icon" aria-hidden>
              <ScanLine className="size-11" strokeWidth={1.25} />
            </div>
            <p className="mobile-ops-empty-state-title">{t('追溯物资')}</p>
            <p className="mobile-ops-empty-state-body">{t('扫描标签二维码，查看当前状态、货位与入库、出库等流转记录')}</p>
            <p className="mobile-ops-empty-state-caption">{t('来源可溯 · 去向可追 · 状态可控')}</p>
          </div>
        )}

        {item === null && data && (
          <div className="mobile-ops-empty">{t('未找到该二维码对应的物资')}</div>
        )}

        {item && (
          <div className="space-y-3">
            <section className="mobile-ops-card space-y-3">
              <h2 className="text-sm font-semibold">{t('物资信息')}</h2>
              <dl className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-xs text-muted-foreground">{t('二维码')}</dt>
                  <dd className="mt-0.5 break-all font-mono text-[13px]">{String(item.qrCode)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">{t('状态')}</dt>
                  <dd className="mt-0.5">
                    <Badge variant="secondary">{STATUS_LABELS[String(item.status)] ?? String(item.status)}</Badge>
                  </dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-xs text-muted-foreground">{t('物资')}</dt>
                  <dd className="mt-0.5 font-medium">{(item.material as { name?: string })?.name ?? '—'}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">{t('数量')}</dt>
                  <dd className="mt-0.5 tabular-nums">{String(item.quantity ?? '—')}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">{t('货位')}</dt>
                  <dd className="mt-0.5">{(item.shelf as { code?: string })?.code ?? '未上架'}</dd>
                </div>
              </dl>
            </section>

            {((item.movements as Array<Record<string, unknown>>) ?? []).length > 0 && (
              <section className="mobile-ops-card">
                <h2 className="mb-3 text-sm font-semibold">{t('流转记录')}</h2>
                <ul className="space-y-3">
                  {((item.movements as Array<Record<string, unknown>>) ?? []).slice(0, 8).map((m, i) => (
                    <li key={String(m.id ?? i)} className="border-b border-border/30 pb-3 last:border-0 last:pb-0">
                      <div className="flex items-center justify-between gap-2">
                        <MovementTypeBadge type={String(m.type)} />
                        <span className="text-[11px] text-muted-foreground tabular-nums">
                          {formatDateTime(String(m.createdAt))}
                        </span>
                      </div>
                      {m.note != null && String(m.note).trim() !== '' && (
                        <p className="mt-1 text-xs text-muted-foreground">{String(m.note)}</p>
                      )}
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
