import { useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useQuery, useMutation, useLazyQuery } from '@apollo/client'
import { MapPin } from 'lucide-react'
import { MobileOpsCrumbBar } from 'components/mobile-ops-crumb-bar'
import { MobileOpsFooterHint } from 'components/mobile-ops-footer-hint'
import { MobileOpsPrimaryBtn } from 'components/mobile-ops-primary-btn'
import { OutboundStatusBadge } from 'components/outbound-status-badge'
import { QrLabelDialog } from 'components/qr-label-dialog'
import type { QrLabelData } from 'components/qr-label'
import { SplitConfirmDialog, type SplitConfirmStock } from 'components/split-confirm-dialog'
import { MessageAlert } from 'components/message-alert'
import { CollabNotice } from 'components/collab-notice'
import { Sheet, SheetContent, SheetTitle } from 'components/ui/sheet'
import { useDocumentRealtime } from 'hooks/use-document-realtime'
import { MOBILE_OPS_SHIP } from 'lib/mobile-ops'
import { formatDate } from 'lib/utils'
import { GET_ORDER, GET_PICK, TRACE_STOCK, START_PICK, PICK, SHIP, COMPLETE } from '../queries'
import { PickPanel } from '../pick-panel'
import { PickSummaryPanel, linePendingPick, summarizeOutboundPick } from '../pick-summary'
import { PickLineCard } from './pick-line-card'
import { useTranslation } from 'react-i18next'

type PageMessage = {
  title: string
  description?: React.ReactNode
  tone?: 'warning' | 'info'
}

function expiryLevelFromDate(expiryDate: string): string {
  const diffDays = (new Date(expiryDate).getTime() - Date.now()) / 86400000
  if (diffDays <= 30) return 'RED'
  if (diffDays <= 90) return 'YELLOW'
  return 'GREEN'
}

export default function OutboundMobileDetail() {
  const { t } = useTranslation()
  const { id } = useParams()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const pickLineId = searchParams.get('pick')

  const { data, refetch } = useQuery(GET_ORDER, { variables: { input: { id } }, skip: !id })
  const { notice: collabNotice } = useDocumentRealtime('outbound', id, () => void refetch())
  const refetchOpts = { refetchQueries: ['GetOutboundOrders', 'GetOutboundOrder'] }
  const [startPick, { loading: starting }] = useMutation(START_PICK, refetchOpts)
  const [pickLineMut, { loading: picking }] = useMutation(PICK, refetchOpts)
  const [shipOrder, { loading: shipping }] = useMutation(SHIP, refetchOpts)
  const [completeOrder, { loading: completing }] = useMutation(COMPLETE, refetchOpts)
  const [traceStock, { loading: tracing }] = useLazyQuery(TRACE_STOCK)

  const [scanQr, setScanQr] = useState('')
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmStock, setConfirmStock] = useState<SplitConfirmStock | null>(null)
  const [confirmQty, setConfirmQty] = useState(0)
  const [labelOpen, setLabelOpen] = useState(false)
  const [labelData, setLabelData] = useState<QrLabelData | null>(null)
  const [pageMessage, setPageMessage] = useState<PageMessage | null>(null)

  const order = data?.getOutboundOrder as Record<string, unknown> | undefined
  const orderLines = (order?.lines as Array<Record<string, unknown>>) ?? []
  const pickLine = pickLineId ? orderLines.find((l) => String(l.id) === pickLineId) : null
  const lineRemaining = pickLine ? linePendingPick(pickLine) : 0

  const { data: pickData } = useQuery(GET_PICK, {
    skip: !pickLine,
    variables: { materialId: String(pickLine?.materialId ?? ''), qty: lineRemaining },
  })
  const pickPayload = pickData?.getPickSuggestions as {
    suggestions: Array<Record<string, unknown>>
    routeTotal?: number
    shortage?: number
  } | undefined
  const suggestions = pickPayload?.suggestions ?? []
  const firstStop = suggestions[0]

  if (!order) return null

  const status = String(order.status)
  const isApproved = status === 'APPROVED'
  const isPicking = status === 'PICKING'
  const isShipped = status === 'SHIPPED'
  const isCompleted = status === 'COMPLETED'
  const summary = summarizeOutboundPick(orderLines)
  const pendingLines = orderLines.filter((l) => linePendingPick(l) > 0)
  const doneLines = orderLines.filter((l) => linePendingPick(l) === 0 && Number(l.pickedQty ?? 0) > 0)
  const showPickSummary = isPicking || isShipped || isCompleted

  const openPick = (line: Record<string, unknown>) => {
    setScanQr('')
    setConfirmOpen(false)
    setConfirmStock(null)
    setSearchParams({ pick: String(line.id) })
  }

  const closePick = () => {
    setConfirmOpen(false)
    setConfirmStock(null)
    setSearchParams({})
  }

  const openConfirmForQr = async (qrCode: string) => {
    if (!pickLine) return
    const trimmed = qrCode.trim()
    if (!trimmed) return

    try {
      const { data: traceData } = await traceStock({ variables: { qrCode: trimmed } })
      const item = traceData?.traceMaterial as Record<string, unknown> | null | undefined
      if (!item) {
        setPageMessage({ title: t('未找到库存'), description: '未找到该二维码对应的库存记录。' })
        return
      }
      if (item.status !== 'IN_STOCK') {
        setPageMessage({ title: t('无法拣货'), description: '该物资不在库，无法拣货。' })
        return
      }
      if (String(item.materialId) !== String(pickLine.materialId)) {
        setPageMessage({ title: t('物资不匹配'), description: '扫码物资与当前出库明细不一致。' })
        return
      }

      const material = item.material as { name?: string; unit?: string } | undefined
      const batch = item.batch as { expiryDate?: string } | undefined
      const shelf = item.shelf as { code?: string; zone?: string } | undefined
      const stockQty = Number(item.quantity)
      const defaultQty = Math.min(stockQty, lineRemaining)

      setScanQr(trimmed)
      setConfirmStock({
        qrCode: trimmed,
        quantity: stockQty,
        shelfCode: shelf?.code,
        zone: shelf?.zone,
        expiryDate: batch?.expiryDate,
        expiryLevel: batch?.expiryDate ? expiryLevelFromDate(batch.expiryDate) : undefined,
        materialName: material?.name ?? '应急物资',
        unit: material?.unit,
      })
      setConfirmQty(defaultQty)
      setConfirmOpen(true)
    } catch (e) {
      setPageMessage({
        title: t('扫码失败'),
        description: e instanceof Error ? e.message : '扫码核对失败，请重试',
      })
    }
  }

  const handleConfirmPick = async () => {
    if (!pickLine || !confirmStock) return
    try {
      const result = await pickLineMut({
        variables: {
          input: {
            lineId: pickLine.id,
            stockQrCode: confirmStock.qrCode,
            pickedQty: confirmQty,
          },
        },
      })
      const payload = result.data?.pickOutboundLine as {
        message?: string
        newQrCode?: string | null
        remaining?: number
        newStockItem?: { quantity?: number }
      } | undefined
      if (payload?.newQrCode) {
        const material = pickLine.material as { name?: string; unit?: string }
        setLabelData({
          qrCode: payload.newQrCode,
          title: material?.name ?? '应急物资',
          subtitle: t('拆零剩余'),
          meta: [`数量 ${payload.remaining ?? payload.newStockItem?.quantity ?? ''}${material?.unit ?? ''}`],
        })
        setLabelOpen(true)
      } else if (payload?.message) {
        setPageMessage({ title: t('拣货提示'), description: payload.message, tone: 'info' })
      }
      setConfirmOpen(false)
      setConfirmStock(null)
      const { data: fresh } = await refetch()
      const freshOrder = fresh?.getOutboundOrder as { lines?: Array<Record<string, unknown>> } | undefined
      const freshLine = freshOrder?.lines?.find((l) => String(l.id) === String(pickLine.id))
      const stillPending = freshLine ? linePendingPick(freshLine) : 0
      if (stillPending > 0) {
        setScanQr('')
      } else {
        closePick()
      }
    } catch (e) {
      setPageMessage({
        title: t('拣货失败'),
        description: e instanceof Error ? e.message : '操作失败，请稍后重试',
      })
    }
  }

  const handleStartPick = async () => {
    if (!id) return
    try {
      await startPick({ variables: { input: { id } } })
      await refetch()
    } catch (e) {
      setPageMessage({
        title: t('无法开始拣货'),
        description: e instanceof Error ? e.message : '操作失败，请稍后重试',
      })
    }
  }

  const handleShip = async () => {
    if (!id) return
    if (pendingLines.length > 0) {
      setPageMessage({
        title: t('尚有明细未拣齐'),
        description: `还有 ${pendingLines.length} 行待拣货，请先完成扫码拣货。`,
        tone: 'warning',
      })
      return
    }
    try {
      await shipOrder({ variables: { input: { id } } })
      await refetch()
    } catch (e) {
      setPageMessage({
        title: t('无法确认出库'),
        description: e instanceof Error ? e.message : '操作失败，请稍后重试',
      })
    }
  }

  const handleComplete = async () => {
    if (!id) return
    try {
      await completeOrder({ variables: { input: { id } } })
      await refetch()
    } catch (e) {
      setPageMessage({
        title: t('无法完成出库'),
        description: e instanceof Error ? e.message : '操作失败，请稍后重试',
      })
    }
  }

  const pickMaterial = pickLine?.material as { name?: string; unit?: string } | undefined

  const showFooter = isApproved || isPicking || isShipped

  return (
    <div className="mobile-ops-page mobile-ops-page--detail">
      <MobileOpsCrumbBar
        backLabel={t('发货')}
        onBack={() => navigate(MOBILE_OPS_SHIP)}
        title={String(order.orderNo ?? '')}
        trailing={<OutboundStatusBadge order={{ status, lines: orderLines as { requestedQty: number; pickedQty?: number | null }[] }} compact />}
      />

      <div className="mobile-ops-page-body space-y-4">
        <CollabNotice message={collabNotice} />
        <section className="mobile-ops-summary">
          <p className="mobile-ops-summary-context truncate px-4 pt-3">
            {String(order.destination ?? '—')}
          </p>
          <div className="flex items-start gap-2 px-4 pb-1 pt-1 text-xs text-muted-foreground">
            <MapPin className="mt-0.5 size-3.5 shrink-0" />
            <span>
              {String(order.purpose ?? '—')}
              {order.plannedShipDate
                ? ` · 计划发货 ${formatDate(String(order.plannedShipDate))}`
                : ''}
            </span>
          </div>
          {showPickSummary && (
            <PickSummaryPanel
              lines={orderLines}
              picking={isPicking}
              phase={isCompleted ? 'completed' : isShipped ? 'shipped' : 'picking'}
              embedded
              compact
            />
          )}
          {isApproved && (
            <p className="mt-2 text-xs text-muted-foreground">{t('审核已通过，点击底部「开始拣货」后扫码出库')}</p>
          )}
          {isPicking && summary.pickFull && (
            <p className="mt-2 px-4 pb-1 text-xs text-muted-foreground">
              {t('拣货已完成，点击底部「确认出库」发运物资')}
            </p>
          )}
          {isShipped && (
            <p className="mt-2 px-4 pb-1 text-xs text-muted-foreground">{t('物资已出库，点击底部「完成出库」结案归档')}</p>
          )}
        </section>

        {isPicking && pendingLines.length > 0 && (
          <section>
            <h2 className="mobile-ops-section-title">待拣货 · {pendingLines.length}</h2>
            <div className="space-y-2">
              {pendingLines.map((line) => (
                <PickLineCard key={String(line.id)} line={line} picking={isPicking} onPick={() => openPick(line)} />
              ))}
            </div>
          </section>
        )}

        {doneLines.length > 0 && (
          <section>
            <h2 className="mobile-ops-section-title">已拣货 · {doneLines.length}</h2>
            <div className="space-y-2">
              {doneLines.map((line) => (
                <PickLineCard
                  key={String(line.id)}
                  line={line}
                  picking={isPicking}
                  orderShipped={isShipped || isCompleted}
                  onPick={() => openPick(line)}
                />
              ))}
            </div>
          </section>
        )}

        {isApproved && orderLines.length > 0 && (
          <section>
            <h2 className="mobile-ops-section-title">出库明细 · {orderLines.length}</h2>
            <div className="space-y-2">
              {orderLines.map((line) => (
                <PickLineCard key={String(line.id)} line={line} picking={false} onPick={() => {}} />
              ))}
            </div>
          </section>
        )}

        {orderLines.length === 0 && <div className="mobile-ops-empty">{t('暂无出库明细')}</div>}
      </div>

      {showFooter && (
        <footer className="mobile-ops-detail-footer">
          {isApproved && (
            <MobileOpsPrimaryBtn loading={starting} loadingLabel="启动中…" onClick={() => void handleStartPick()}>开始拣货</MobileOpsPrimaryBtn>
          )}
          {isPicking && summary.pending > 0 && (
            <MobileOpsFooterHint pending={summary.pending} action="待拣" />
          )}
          {isPicking && summary.pending === 0 && (
            <MobileOpsPrimaryBtn loading={shipping} onClick={() => void handleShip()}>确认出库</MobileOpsPrimaryBtn>
          )}
          {isShipped && (
            <MobileOpsPrimaryBtn loading={completing} onClick={() => void handleComplete()}>完成出库</MobileOpsPrimaryBtn>
          )}
        </footer>
      )}

      <Sheet open={!!pickLine} onOpenChange={(open) => { if (!open) closePick() }}>
        <SheetContent
          side="bottom"
          hideClose
          className="mobile-ops-sheet max-h-[92vh] overflow-y-auto rounded-t-2xl px-0 pb-8"
        >
          <div className="mobile-ops-sheet-toolbar">
            <button type="button" className="mobile-ops-sheet-toolbar-btn" onClick={closePick}>{t('取消')}</button>
            <SheetTitle className="mobile-ops-sheet-toolbar-title">
              {pickMaterial?.name ?? '扫码拣货'}
            </SheetTitle>
            <span className="mobile-ops-sheet-toolbar-spacer" aria-hidden />
          </div>
          {pickLine && (
            <PickPanel
              className="mobile-receive-form mx-4 border-0 bg-transparent shadow-none"
              materialName={pickMaterial?.name ?? '—'}
              unit={pickMaterial?.unit}
              requestedQty={Number(pickLine.requestedQty)}
              pickedQty={Number(pickLine.pickedQty ?? 0)}
              pendingQty={lineRemaining}
              suggestions={suggestions}
              routeTotal={pickPayload?.routeTotal}
              shortage={pickPayload?.shortage}
              firstStop={firstStop}
              scanQr={scanQr}
              onScanQrChange={setScanQr}
              onScanSubmit={(qr) => void openConfirmForQr(qr)}
              onSelectSuggestion={(qr) => void openConfirmForQr(qr)}
              onCancel={closePick}
              scanning={tracing}
              picking={picking}
            />
          )}
        </SheetContent>
      </Sheet>

      <SplitConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        stock={confirmStock}
        requestedQty={lineRemaining}
        pickedQty={confirmQty}
        onChangeQty={setConfirmQty}
        onConfirm={() => void handleConfirmPick()}
        confirming={picking}
      />

      <QrLabelDialog
        open={labelOpen}
        onOpenChange={setLabelOpen}
        label={labelData}
        description={t('拆零产生新库存单元，请打印标签贴于剩余物资')}
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
