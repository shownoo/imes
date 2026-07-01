import { useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useQuery, useMutation } from '@apollo/client'
import { MobileOpsCrumbBar } from 'components/mobile-ops-crumb-bar'
import { MobileOpsFooterHint } from 'components/mobile-ops-footer-hint'
import { MobileOpsPrimaryBtn } from 'components/mobile-ops-primary-btn'
import { MapPin } from 'lucide-react'
import { InboundStatusBadge } from 'components/inbound-status-badge'
import { QrLabelDialog } from 'components/qr-label-dialog'
import type { QrLabelData } from 'components/qr-label'
import { stockItemToLabel } from 'components/qr-label'
import { ReceiveCodingPanel, type ReceiveCodingForm, type ReceivedBatchRow } from 'components/receive-coding-panel'
import { MessageAlert } from 'components/message-alert'
import { CollabNotice } from 'components/collab-notice'
import { Sheet, SheetContent, SheetTitle } from 'components/ui/sheet'
import { useDocumentRealtime } from 'hooks/use-document-realtime'
import { MOBILE_OPS_HOME } from 'lib/mobile-ops'
import { GET_ORDER, RECEIVE, COMPLETE } from '../queries'
import { linePending } from '../receive-lines-table'
import { ReceiveSummaryPanel, summarizeInboundReceive } from '../receive-summary'
import { ReceiveLineCard } from './receive-line-card'
import { formatDate } from 'lib/utils'
import { useTranslation } from 'react-i18next'

type PageMessage = {
  title: string
  description?: React.ReactNode
  tone?: 'warning' | 'info'
}

function lineReceivedBatches(line: Record<string, unknown>): ReceivedBatchRow[] {
  const items = (line.stockItems as Array<Record<string, unknown>>) ?? []
  return items.map((item) => ({
    batchNo: (item.batch as { batchNo?: string })?.batchNo ?? '—',
    qty: Number(item.quantity ?? 0),
    productionDate: (item.batch as { productionDate?: string })?.productionDate
      ? String((item.batch as { productionDate?: string }).productionDate)
      : undefined,
  }))
}

export default function InboundMobileDetail() {
  const { t } = useTranslation()
  const { id } = useParams()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const receiveLineId = searchParams.get('receive')

  const { data, refetch } = useQuery(GET_ORDER, { variables: { input: { id } }, skip: !id })
  const { notice: collabNotice } = useDocumentRealtime('inbound', id, () => void refetch())
  const refetchOpts = { refetchQueries: ['GetInboundOrders', 'GetInboundOrder'] }
  const [receiveLineMut, { loading: receiving }] = useMutation(RECEIVE, refetchOpts)
  const [completeOrder, { loading: completing }] = useMutation(COMPLETE, refetchOpts)

  const order = data?.getInboundOrder as Record<string, unknown> | undefined
  const orderLines = (order?.lines as Array<Record<string, unknown>>) ?? []
  const receiveLine = receiveLineId ? orderLines.find((l) => String(l.id) === receiveLineId) : null
  const warehouseName = (order?.warehouse as { name?: string })?.name

  const [receiveForm, setReceiveForm] = useState<ReceiveCodingForm>({
    actualQty: 0,
    batchNo: '',
    productionDate: new Date().toISOString().slice(0, 10),
  })
  const [labelOpen, setLabelOpen] = useState(false)
  const [labelData, setLabelData] = useState<QrLabelData | null>(null)
  const [pageMessage, setPageMessage] = useState<PageMessage | null>(null)

  if (!order) return null

  const isReceiving = order.status === 'RECEIVING'
  const isCompleted = order.status === 'COMPLETED'
  const summary = summarizeInboundReceive(orderLines)
  const pendingLines = orderLines.filter((l) => linePending(l) > 0)
  const doneLines = orderLines.filter((l) => linePending(l) === 0 && Number(l.actualQty ?? 0) > 0)

  const openReceive = (line: Record<string, unknown>) => {
    const pending = linePending(line)
    setReceiveForm({
      actualQty: pending,
      batchNo: '',
      productionDate: new Date().toISOString().slice(0, 10),
    })
    setSearchParams({ receive: String(line.id) })
  }

  const closeReceive = () => setSearchParams({})

  const handleReceive = async () => {
    if (!receiveLine || !id) return
    const pending = linePending(receiveLine)
    if (receiveForm.actualQty <= 0 || receiveForm.actualQty > pending) {
      setPageMessage({ title: t('数量不正确'), description: `实收数量须在 1～${pending.toLocaleString()} 之间。` })
      return
    }
    if (!receiveForm.batchNo.trim()) {
      setPageMessage({ title: t('请填写批次号'), description: t('请录入外包装批次号。') })
      return
    }
    try {
      const result = await receiveLineMut({
        variables: {
          input: {
            orderId: id,
            lineId: receiveLine.id,
            actualQty: receiveForm.actualQty,
            batchNo: receiveForm.batchNo.trim(),
            productionDate: new Date(receiveForm.productionDate).toISOString(),
          },
        },
      })
      const payload = result.data?.receiveInboundLine as { qrCode?: string } | undefined
      const material = receiveLine.material as { name?: string; unit?: string }
      if (payload?.qrCode) {
        setLabelData({
          qrCode: payload.qrCode,
          title: material?.name ?? '应急物资',
          subtitle: `批次 ${receiveForm.batchNo.trim()}`,
          meta: [`本批 ${receiveForm.actualQty}${material?.unit ?? ''}`, '采购入库'],
        })
        setLabelOpen(true)
      }
      const { data: fresh } = await refetch()
      const freshOrder = fresh?.getInboundOrder as { lines?: Array<Record<string, unknown>> } | undefined
      const freshLine = freshOrder?.lines?.find((l) => String(l.id) === String(receiveLine.id))
      const stillPending = freshLine ? linePending(freshLine) : 0
      if (stillPending > 0) {
        setReceiveForm({
          actualQty: stillPending,
          batchNo: '',
          productionDate: new Date().toISOString().slice(0, 10),
        })
      } else {
        closeReceive()
      }
    } catch (e) {
      setPageMessage({
        title: t('收货失败'),
        description: e instanceof Error ? e.message : '操作失败，请稍后重试',
      })
    }
  }

  const handleComplete = async () => {
    if (!id) return
    if (pendingLines.length > 0) {
      setPageMessage({
        title: t('尚有明细未收齐'),
        description: `还有 ${pendingLines.length} 行待收货，请先完成赋码。`,
        tone: 'warning',
      })
      return
    }
    try {
      await completeOrder({ variables: { input: { id } } })
      await refetch()
    } catch (e) {
      setPageMessage({
        title: t('无法完成入库'),
        description: e instanceof Error ? e.message : '操作失败，请稍后重试',
      })
    }
  }

  const handleReprint = (stockItem: Record<string, unknown>) => {
    const label = stockItemToLabel(stockItem)
    setLabelData({ ...label, meta: [...(label.meta ?? []), '采购入库'] })
    setLabelOpen(true)
  }

  const receiveMaterial = receiveLine?.material as {
    name?: string
    unit?: string
    category?: { shelfLifeMonths?: number | null }
  } | undefined

  return (
    <div className="mobile-ops-page mobile-ops-page--detail">
      <MobileOpsCrumbBar
        backLabel={t('收货')}
        onBack={() => navigate(MOBILE_OPS_HOME)}
        title={String(order.orderNo ?? '')}
        trailing={<InboundStatusBadge order={{ status: order.status, lines: orderLines as { expectedQty: number; actualQty?: number | null }[] }} compact />}
      />

      <div className="mobile-ops-page-body space-y-4">
        <CollabNotice message={collabNotice} />
        <section className="mobile-ops-summary">
          <p className="mobile-ops-summary-context truncate px-4 pt-3">
            {(order.supplier as { name?: string })?.name ?? '—'}
          </p>
          <div className="flex items-start gap-2 px-4 pb-1 pt-1 text-xs text-muted-foreground">
            <MapPin className="mt-0.5 size-3.5 shrink-0" />
            <span>
              {warehouseName ?? '—'}
              {warehouseName && isReceiving && ' · 上架请扫货位码'}
            </span>
          </div>
          {(isReceiving || isCompleted) && (
            <ReceiveSummaryPanel lines={orderLines} receiving={isReceiving} embedded compact />
          )}
          {isReceiving && summary.receiveFull && (
            <p className="mt-2 px-4 pb-1 text-xs text-muted-foreground">
              收货已完成，点击底部「完成入库」结案归档
            </p>
          )}
          {!isReceiving && !isCompleted && (
            <p className="mt-2 px-4 pb-3 text-xs text-muted-foreground">
              创建日期 {formatDate(String(order.orderDate ?? order.createdAt))}
            </p>
          )}
        </section>

        {isReceiving && pendingLines.length > 0 && (
          <section>
            <h2 className="mobile-ops-section-title">待收货 · {pendingLines.length}</h2>
            <div className="space-y-2">
              {pendingLines.map((line) => (
                <ReceiveLineCard
                  key={String(line.id)}
                  line={line}
                  receiving={isReceiving}
                  onReceive={() => openReceive(line)}
                />
              ))}
            </div>
          </section>
        )}

        {doneLines.length > 0 && (
          <section>
            <h2 className="mobile-ops-section-title">已收货 · {doneLines.length}</h2>
            <div className="space-y-2">
              {doneLines.map((line) => (
                <ReceiveLineCard
                  key={String(line.id)}
                  line={line}
                  receiving={isReceiving}
                  orderCompleted={isCompleted}
                  onReceive={() => openReceive(line)}
                  onReprint={handleReprint}
                />
              ))}
            </div>
          </section>
        )}

        {orderLines.length === 0 && (
          <div className="mobile-ops-empty">{t('暂无入库明细')}</div>
        )}
      </div>

      {isReceiving && (
        <footer className="mobile-ops-detail-footer">
          {summary.pending > 0 ? (
            <MobileOpsFooterHint pending={summary.pending} action="待收" />
          ) : (
            <MobileOpsPrimaryBtn loading={completing} onClick={() => void handleComplete()}>完成入库</MobileOpsPrimaryBtn>
          )}
        </footer>
      )}

      <Sheet open={!!receiveLine} onOpenChange={(open) => { if (!open) closeReceive() }}>
        <SheetContent
          side="bottom"
          hideClose
          className="mobile-ops-sheet max-h-[92vh] overflow-y-auto rounded-t-2xl px-0 pb-8"
        >
          <div className="mobile-ops-sheet-toolbar">
            <button type="button" className="mobile-ops-sheet-toolbar-btn" onClick={closeReceive}>{t('取消')}</button>
            <SheetTitle className="mobile-ops-sheet-toolbar-title">
              {receiveMaterial?.name ?? '收货赋码'}
            </SheetTitle>
            <span className="mobile-ops-sheet-toolbar-spacer" aria-hidden />
          </div>
          {receiveLine && (
            <ReceiveCodingPanel
              className="mobile-receive-form mx-4 border-0 bg-transparent shadow-none"
              materialName={receiveMaterial?.name ?? '—'}
              unit={receiveMaterial?.unit}
              expectedQty={Number(receiveLine.expectedQty)}
              receivedQty={Number(receiveLine.actualQty ?? 0)}
              receivedBatches={lineReceivedBatches(receiveLine)}
              pendingQty={linePending(receiveLine)}
              shelfLifeMonths={receiveMaterial?.category?.shelfLifeMonths}
              value={receiveForm}
              onChange={setReceiveForm}
              onCancel={closeReceive}
              onSubmit={() => void handleReceive()}
              submitting={receiving}
            />
          )}
        </SheetContent>
      </Sheet>

      <QrLabelDialog
        open={labelOpen}
        onOpenChange={setLabelOpen}
        label={labelData}
        description={t('赋码成功，请打印标签贴于外包装')}
      />

      <MessageAlert
        open={!!pageMessage}
        onOpenChange={(open) => { if (!open) setPageMessage(null) }}
        title={pageMessage?.title ?? ''}
        description={pageMessage?.description}
        tone={pageMessage?.tone}
      />
    </div>
  )
}
