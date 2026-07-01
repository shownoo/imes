import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useQuery, useMutation, useLazyQuery } from '@apollo/client'
import { Pencil } from 'lucide-react'
import {
  DocumentPage,
  GroupedFormSection,
  GroupedFormRow,
  GroupedFormItem,
  GroupedFormStack,
  GroupedFormReadonlyField,
  DocumentLinesSection,
} from 'components/form-page'
import { Button } from 'components/common'
import { StatusBadge } from 'components/status-badge'
import { QrLabelDialog } from 'components/qr-label-dialog'
import type { QrLabelData } from 'components/qr-label'
import { SplitConfirmDialog, type SplitConfirmStock } from 'components/split-confirm-dialog'
import { ApprovalFlowViewer } from 'components/approval/flow-viewer'
import type { FlowGraph, NodeProgressState } from 'lib/approval-flow'
import { canActOnAssignee } from 'lib/approval-flow'
import { useAuth } from 'lib/auth'
import { MessageAlert } from 'components/message-alert'
import { PrintButton } from 'components/print-button'
import { LEGAL_PRINT_TEMPLATE } from 'lib/print-keys'
import { formatDate } from 'lib/utils'
import { GET_ORDER, GET_PICK, GET_APPROVAL, TRACE_STOCK, SUBMIT, APPROVE, START_PICK, PICK, SHIP, COMPLETE } from './queries'
import { PickLinesTable, linePendingPick } from './pick-lines-table'
import { PickSummaryPanel } from './pick-summary'
import { PickPanel } from './pick-panel'

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

export default function OutboundDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const pickLineId = searchParams.get('pick')
  const panelRef = useRef<HTMLDivElement>(null)

  const [scanQr, setScanQr] = useState('')
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmStock, setConfirmStock] = useState<SplitConfirmStock | null>(null)
  const [confirmQty, setConfirmQty] = useState(0)
  const [labelOpen, setLabelOpen] = useState(false)
  const [labelData, setLabelData] = useState<QrLabelData | null>(null)
  const [pageMessage, setPageMessage] = useState<PageMessage | null>(null)

  const { data, refetch } = useQuery(GET_ORDER, { variables: { input: { id } }, skip: !id })
  const { data: approvalData } = useQuery(GET_APPROVAL, {
    variables: { bizType: 'outbound', bizId: id! },
    skip: !id || !data?.getOutboundOrder,
  })
  const refetchOpts = { refetchQueries: ['GetOutboundOrders', 'GetOutboundOrder'] }
  const [submitOrder] = useMutation(SUBMIT, refetchOpts)
  const [approveOrder] = useMutation(APPROVE, refetchOpts)
  const [startPick] = useMutation(START_PICK, refetchOpts)
  const [pickLineMut, { loading: picking }] = useMutation(PICK, refetchOpts)
  const [shipOrder] = useMutation(SHIP, refetchOpts)
  const [completeOrder] = useMutation(COMPLETE, refetchOpts)
  const [traceStock, { loading: tracing }] = useLazyQuery(TRACE_STOCK)

  const order = data?.getOutboundOrder as Record<string, unknown> | undefined
  const approval = approvalData?.getApprovalInstance as {
    flow?: { graph?: FlowGraph }
    progress?: Array<{ id: string; state: NodeProgressState }>
    tasks?: Array<{ id: string; nodeLabel?: string; status: string; assigneeRole?: string; actedBy?: { name?: string }; comment?: string }>
  } | null
  const myPendingTask = approval?.tasks?.find(
    (t) => t.status === 'PENDING' && canActOnAssignee(user?.role ?? '', t.assigneeRole),
  )
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
  const allPicked = orderLines.length > 0 && orderLines.every((l) => Number(l.pickedQty ?? 0) >= Number(l.requestedQty))
  const isPicking = order?.status === 'PICKING'
  const showPickSummary = isPicking || order?.status === 'SHIPPED' || order?.status === 'COMPLETED'

  const showMessage = (msg: PageMessage) => setPageMessage(msg)

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

  useEffect(() => {
    if (!pickLineId) return
    panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [pickLineId])

  const openConfirmForQr = async (qrCode: string) => {
    if (!pickLine) return
    const trimmed = qrCode.trim()
    if (!trimmed) return

    try {
      const { data: traceData } = await traceStock({ variables: { qrCode: trimmed } })
      const item = traceData?.traceMaterial as Record<string, unknown> | null | undefined
      if (!item) {
        showMessage({ title: '未找到库存', description: '未找到该二维码对应的库存记录。' })
        return
      }
      if (item.status !== 'IN_STOCK') {
        showMessage({ title: '无法拣货', description: '该物资不在库，无法拣货。' })
        return
      }
      if (String(item.materialId) !== String(pickLine.materialId)) {
        showMessage({ title: '物资不匹配', description: '扫码物资与当前出库明细不一致。' })
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
      showMessage({
        title: '扫码失败',
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
          subtitle: '拆零剩余',
          meta: [`数量 ${payload.remaining ?? payload.newStockItem?.quantity ?? ''}${material?.unit ?? ''}`],
        })
        setLabelOpen(true)
      } else if (payload?.message) {
        showMessage({ title: '拣货提示', description: payload.message, tone: 'info' })
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
      showMessage({
        title: '拣货失败',
        description: e instanceof Error ? e.message : '操作失败，请稍后重试',
      })
    }
  }

  const handleShip = async () => {
    if (!id) return
    const incomplete = orderLines.filter((line) => linePendingPick(line) > 0)
    if (incomplete.length > 0) {
      showMessage({
        title: '无法确认出库',
        description: (
          <>
            <p className="mb-2.5">以下明细尚未拣齐，请先完成 FIFO 拣货：</p>
            <ul className="divide-y divide-border/35 overflow-hidden rounded-lg border border-border/50 bg-muted/25">
              {incomplete.map((line) => {
                const material = line.material as { name?: string; unit?: string }
                const pending = linePendingPick(line)
                return (
                  <li key={String(line.id)} className="flex items-center justify-between gap-3 px-3 py-2 text-[13px]">
                    <span className="truncate font-medium text-foreground">{material?.name ?? '—'}</span>
                    <span className="shrink-0 tabular-nums text-amber-600">
                      待拣 {pending.toLocaleString()}{material?.unit ? ` ${material.unit}` : ''}
                    </span>
                  </li>
                )
              })}
            </ul>
          </>
        ),
      })
      return
    }
    try {
      await shipOrder({ variables: { input: { id } } })
      refetch()
    } catch (e) {
      showMessage({
        title: '无法确认出库',
        description: e instanceof Error ? e.message : '操作失败，请稍后重试',
      })
    }
  }

  if (!order) return null

  const pickMaterial = pickLine?.material as { name?: string; unit?: string } | undefined

  return (
    <DocumentPage
      title={String(order.orderNo ?? '')}
      backTo="/outbound"
      backLabel="出库管理"
      wide
      footer={
        <>
          {id && order.status !== 'DRAFT' && (
            <PrintButton templateKey={LEGAL_PRINT_TEMPLATE.PrintOutbound} documentId={id} />
          )}
          {order.status === 'DRAFT' && (
            <>
              <Button size="sm" variant="outline" onClick={() => navigate(`/outbound/${id}/edit`)}>
                <Pencil className="size-3.5" />编辑
              </Button>
              <Button size="sm" onClick={async () => { await submitOrder({ variables: { input: { id } } }); refetch() }}>提交审核</Button>
            </>
          )}
          {order.status === 'PENDING' && myPendingTask && (
            <>
              <Button size="sm" variant="destructive" onClick={async () => { await approveOrder({ variables: { input: { id }, approved: false, rejectReason: '不符合调拨条件' } }); refetch() }}>驳回</Button>
              <Button size="sm" onClick={async () => { await approveOrder({ variables: { input: { id }, approved: true } }); refetch() }}>审核通过</Button>
            </>
          )}
          {order.status === 'APPROVED' && (
            <Button size="sm" onClick={async () => { await startPick({ variables: { input: { id } } }); refetch() }}>开始拣货</Button>
          )}
          {isPicking && allPicked && (
            <Button size="sm" onClick={() => void handleShip()}>确认出库</Button>
          )}
          {order.status === 'SHIPPED' && (
            <Button size="sm" onClick={async () => { await completeOrder({ variables: { input: { id } } }); refetch() }}>完成单据</Button>
          )}
        </>
      }
    >
      <GroupedFormStack>
        <GroupedFormSection title="出库信息">
          <GroupedFormRow>
            <GroupedFormItem label="用途">
              <GroupedFormReadonlyField>{String(order.purpose ?? '—')}</GroupedFormReadonlyField>
            </GroupedFormItem>
            <GroupedFormItem label="目的地">
              <GroupedFormReadonlyField>{String(order.destination ?? '—')}</GroupedFormReadonlyField>
            </GroupedFormItem>
          </GroupedFormRow>
          <GroupedFormRow>
            <GroupedFormItem label="领用人">
              <GroupedFormReadonlyField>{String(order.recipient ?? '—')}</GroupedFormReadonlyField>
            </GroupedFormItem>
            <GroupedFormItem label="创建时间">
              <GroupedFormReadonlyField>{formatDate(String(order.createdAt))}</GroupedFormReadonlyField>
            </GroupedFormItem>
          </GroupedFormRow>
          <GroupedFormRow>
            <GroupedFormItem label="状态">
              <GroupedFormReadonlyField className="border-0 bg-transparent px-1 shadow-none">
                <StatusBadge status={String(order.status)} />
              </GroupedFormReadonlyField>
            </GroupedFormItem>
            {order.rejectReason ? (
              <GroupedFormItem label="驳回原因">
                <GroupedFormReadonlyField>{String(order.rejectReason)}</GroupedFormReadonlyField>
              </GroupedFormItem>
            ) : (
              <GroupedFormItem label="单号">
                <GroupedFormReadonlyField>{String(order.orderNo ?? '—')}</GroupedFormReadonlyField>
              </GroupedFormItem>
            )}
          </GroupedFormRow>
          {showPickSummary && (
            <PickSummaryPanel lines={orderLines} picking={isPicking} embedded compact />
          )}
        </GroupedFormSection>

        {approval?.flow?.graph && order.status !== 'DRAFT' && (
          <GroupedFormSection title="审批流程">
            <GroupedFormItem>
              <ApprovalFlowViewer graph={approval.flow.graph} progress={approval.progress} />
            </GroupedFormItem>
          </GroupedFormSection>
        )}

        <DocumentLinesSection
          title="出库清单"
          caption={isPicking ? '按 FIFO 路线扫码拣货，拆零需确认数量' : undefined}
          trailing={orderLines.length > 0 ? (
            <span className="text-xs tabular-nums text-muted-foreground">{orderLines.length} 行</span>
          ) : undefined}
        >
          <PickLinesTable
            lines={orderLines}
            picking={isPicking}
            orderShipped={order.status === 'SHIPPED' || order.status === 'COMPLETED'}
            activeLineId={pickLineId}
            onPick={openPick}
          />
        </DocumentLinesSection>

        {pickLine && (
          <div ref={panelRef}>
            <PickPanel
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
          </div>
        )}
      </GroupedFormStack>

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
        description="拆零产生新库存单元，请打印标签贴于剩余物资"
      />

      <MessageAlert
        open={!!pageMessage}
        onOpenChange={(open) => { if (!open) setPageMessage(null) }}
        title={pageMessage?.title ?? ''}
        description={pageMessage?.description}
        tone={pageMessage?.tone}
      />
    </DocumentPage>
  )
}
