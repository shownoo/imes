import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@apollo/client'
import { MobileOpsCrumbBar } from 'components/mobile-ops-crumb-bar'
import { QrScanInput } from 'components/qr-scan-input'
import { MessageAlert } from 'components/message-alert'
import { Button, Badge } from 'components/common'
import { TRANSFER_STOCK_ITEM } from './queries'
import { MOBILE_OPS_ME } from 'lib/mobile-ops'
import { STATUS_LABELS } from 'lib/utils'
import { useTranslation } from 'react-i18next'

export default function OpsMobileTransfer() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [qrCode, setQrCode] = useState('')
  const [toShelfCode, setToShelfCode] = useState('')
  const [result, setResult] = useState<Record<string, unknown> | null>(null)
  const [pageMessage, setPageMessage] = useState<{ title: string; description?: string; tone?: 'info' | 'warning' } | null>(null)

  const [transfer, { loading }] = useMutation(TRANSFER_STOCK_ITEM, {
    onCompleted: (res) => {
      setResult(res.transferStockItem as Record<string, unknown>)
      setPageMessage({ title: t('移库成功'), tone: 'info' })
      setQrCode('')
      setToShelfCode('')
    },
    onError: (e) => setPageMessage({ title: t('移库失败'), description: e.message, tone: 'warning' }),
  })

  const submit = () => {
    if (!qrCode.trim() || !toShelfCode.trim()) {
      setPageMessage({ title: t('请填写物资码与目标货位'), tone: 'warning' })
      return
    }
    transfer({ variables: { qrCode: qrCode.trim(), toShelfCode: toShelfCode.trim() } })
  }

  return (
    <div className="mobile-ops-page">
      <MobileOpsCrumbBar title={t('移库调位')} onBack={() => navigate(MOBILE_OPS_ME)} backLabel={t('我的')} />
      <div className="mobile-ops-page-body space-y-4">
        <MessageAlert
          open={!!pageMessage}
          onOpenChange={(open) => { if (!open) setPageMessage(null) }}
          title={pageMessage?.title ?? ''}
          description={pageMessage?.description}
          tone={pageMessage?.tone}
        />

        <section className="mobile-ops-card space-y-3">
          <h2 className="text-sm font-semibold">{t('物资二维码')}</h2>
          <QrScanInput
            value={qrCode}
            onChange={setQrCode}
            disabled={loading}
            placeholder={t('扫描要移动的物资')}
          />
        </section>

        <section className="mobile-ops-card space-y-3">
          <h2 className="text-sm font-semibold">{t('目标货位')}</h2>
          <QrScanInput
            value={toShelfCode}
            onChange={setToShelfCode}
            disabled={loading}
            placeholder={t('扫描或输入货位编码')}
          />
        </section>

        <Button className="h-11 w-full" disabled={loading} onClick={submit}>
          {loading ? '移库中…' : '确认移库'}
        </Button>

        {result && (
          <section className="mobile-ops-card space-y-2">
            <h2 className="text-sm font-semibold">{t('上次移库结果')}</h2>
            <dl className="grid grid-cols-2 gap-2 text-sm">
              <div className="col-span-2">
                <dt className="text-xs text-muted-foreground">{t('物资')}</dt>
                <dd className="font-medium">{(result.material as { name?: string })?.name ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">{t('二维码')}</dt>
                <dd className="font-mono text-[12px]">{String(result.qrCode)}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">{t('状态')}</dt>
                <dd>
                  <Badge variant="secondary">
                    {STATUS_LABELS[String(result.status)] ?? String(result.status)}
                  </Badge>
                </dd>
              </div>
              <div className="col-span-2">
                <dt className="text-xs text-muted-foreground">{t('当前货位')}</dt>
                <dd>{(result.shelf as { code?: string })?.code ?? '未上架'}</dd>
              </div>
            </dl>
          </section>
        )}
      </div>
    </div>
  )
}
