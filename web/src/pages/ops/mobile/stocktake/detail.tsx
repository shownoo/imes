import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery } from '@apollo/client'
import { MobileOpsCrumbBar } from 'components/mobile-ops-crumb-bar'
import { QrScanInput } from 'components/qr-scan-input'
import { MessageAlert } from 'components/message-alert'
import { Button, Badge } from 'components/common'
import {
  COUNT_STOCKTAKE_LINE,
  COMPLETE_STOCKTAKE_TASK,
  GET_STOCKTAKE_TASK,
} from '../queries'
import { MOBILE_OPS_TOOLS_STOCKTAKE } from 'lib/mobile-ops'
import { cn } from 'lib/utils'

type Line = Record<string, unknown>

function lineMaterial(line: Line): string {
  return (line.stockItem as { material?: { name?: string } })?.material?.name ?? '—'
}

function lineQr(line: Line): string {
  return String((line.stockItem as { qrCode?: string })?.qrCode ?? '—')
}

export default function OpsStocktakeDetail() {
  const { t } = useTranslation()
  const { id } = useParams()
  const navigate = useNavigate()
  const [qrCode, setQrCode] = useState('')
  const [actualQty, setActualQty] = useState('')
  const [selectedLineId, setSelectedLineId] = useState<string | null>(null)
  const [pageMessage, setPageMessage] = useState<{ title: string; description?: string; tone?: 'info' | 'warning' } | null>(null)

  const { data, refetch } = useQuery(GET_STOCKTAKE_TASK, {
    variables: { id },
    skip: !id,
  })

  const task = data?.getStocktakeTask as Record<string, unknown> | null | undefined
  const lines = (task?.lines as Line[]) ?? []
  const isCompleted = task?.status === 'COMPLETED'
  const countedCount = Number(task?.countedCount ?? 0)
  const lineCount = lines.length
  const varianceCount = Number(task?.varianceCount ?? 0)

  const [countLine, { loading: counting }] = useMutation(COUNT_STOCKTAKE_LINE, {
    onCompleted: () => {
      setQrCode('')
      setActualQty('')
      setSelectedLineId(null)
      setPageMessage({ title: t('已记录实盘数量'), tone: 'info' })
      void refetch()
    },
    onError: (e) => setPageMessage({ title: t('清点失败'), description: e.message, tone: 'warning' }),
  })

  const [completeTask, { loading: completing }] = useMutation(COMPLETE_STOCKTAKE_TASK, {
    onCompleted: () => {
      setPageMessage({ title: t('盘点已完成'), description: '差异项已自动调整库存', tone: 'info' })
      void refetch()
    },
    onError: (e) => setPageMessage({ title: t('无法完成'), description: e.message, tone: 'warning' }),
  })

  const selectByQr = (qr: string) => {
    const line = lines.find((l) => lineQr(l) === qr)
    if (line) {
      setSelectedLineId(String(line.id))
      setActualQty(String(line.actualQty ?? (line.stockItem as { quantity?: number })?.quantity ?? ''))
    }
  }

  const submitCount = () => {
    if (!id || !qrCode.trim()) return
    const qty = parseInt(actualQty, 10)
    if (Number.isNaN(qty) || qty < 0) {
      setPageMessage({ title: t('请输入有效数量'), tone: 'warning' })
      return
    }
    countLine({ variables: { taskId: id, qrCode: qrCode.trim(), actualQty: qty } })
  }

  if (!task) return null

  return (
    <div className="mobile-ops-page">
      <MobileOpsCrumbBar
        title={String(task.title ?? task.taskNo)}
        onBack={() => navigate(MOBILE_OPS_TOOLS_STOCKTAKE)}
        backLabel={t('盘点任务')}
      />
      <div className="mobile-ops-page-body space-y-4">
        <MessageAlert
          open={!!pageMessage}
          onOpenChange={(open) => { if (!open) setPageMessage(null) }}
          title={pageMessage?.title ?? ''}
          description={pageMessage?.description}
          tone={pageMessage?.tone}
        />

        <section className="mobile-ops-card">
          <div className="flex items-center justify-between gap-2 text-sm">
            <span className="text-muted-foreground">{t('进度')}</span>
            <span className="font-medium tabular-nums">
              {countedCount}/{lineCount}
              {varianceCount > 0 && (
                <span className="ml-2 text-amber-600">差异 {varianceCount}</span>
              )}
            </span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: lineCount ? `${(countedCount / lineCount) * 100}%` : '0%' }}
            />
          </div>
        </section>

        {!isCompleted && (
          <section className="mobile-ops-card space-y-3">
            <h2 className="text-sm font-semibold">{t('扫码清点')}</h2>
            <QrScanInput
              value={qrCode}
              onChange={setQrCode}
              onSubmit={(qr) => {
                setQrCode(qr)
                selectByQr(qr)
              }}
              submitLabel="定位"
              disabled={counting}
              placeholder={t('扫描物资二维码')}
            />
            <label className="block text-sm">
              <span className="mb-1.5 block text-xs text-muted-foreground">{t('实盘数量')}</span>
              <input
                type="number"
                min={0}
                className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm tabular-nums"
                value={actualQty}
                onChange={(e) => setActualQty(e.target.value)}
                placeholder={t('输入清点后数量')}
              />
            </label>
            <Button className="h-10 w-full" disabled={counting || !qrCode.trim()} onClick={submitCount}>
              {counting ? '提交中…' : '确认实盘'}
            </Button>
          </section>
        )}

        <section className="space-y-2">
          <h2 className="mobile-ops-section-title px-0.5">{t('盘点明细')}</h2>
          {lines.length === 0 && <div className="mobile-ops-empty">{t('范围内无在库物资')}</div>}
          {lines.map((line) => {
            const counted = line.actualQty != null
            const bookQty = Number(line.bookQty ?? 0)
            const actual = line.actualQty != null ? Number(line.actualQty) : null
            const diff = actual != null ? actual - bookQty : null
            const isSelected = selectedLineId === String(line.id)
            return (
              <div
                key={String(line.id)}
                className={cn(
                  'mobile-ops-card px-3.5 py-3',
                  isSelected && 'ring-1 ring-primary/40',
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{lineMaterial(line)}</p>
                    <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">{lineQr(line)}</p>
                  </div>
                  {counted ? (
                    <Badge variant={diff === 0 ? 'secondary' : 'destructive'}>
                      {diff === 0 ? '一致' : diff! > 0 ? `+${diff}` : String(diff)}
                    </Badge>
                  ) : (
                    <Badge variant="outline">{t('待盘')}</Badge>
                  )}
                </div>
                <p className="mt-2 text-xs text-muted-foreground tabular-nums">
                  账面 {bookQty}
                  {actual != null && <> · 实盘 {actual}</>}
                </p>
              </div>
            )
          })}
        </section>

        {!isCompleted && countedCount === lineCount && lineCount > 0 && (
          <Button
            className="h-11 w-full"
            disabled={completing}
            onClick={() => completeTask({ variables: { id } })}
          >
            {completing ? '提交中…' : '完成盘点并调整差异'}
          </Button>
        )}

        {isCompleted && (
          <div className="mobile-ops-empty text-primary">{t('盘点已完成')}</div>
        )}
      </div>
    </div>
  )
}
