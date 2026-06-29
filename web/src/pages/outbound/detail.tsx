import { useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useQuery, useMutation, useLazyQuery } from '@apollo/client'
import { MapPin, Pencil } from 'lucide-react'
import { DocumentPage } from 'components/form-page'
import { Button, Card, CardContent } from 'components/common'
import { StatusBadge } from 'components/status-badge'
import { QrLabelDialog } from 'components/qr-label-dialog'
import type { QrLabelData } from 'components/qr-label'
import { QrScanInput } from 'components/qr-scan-input'
import { SplitConfirmDialog, type SplitConfirmStock } from 'components/split-confirm-dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from 'components/ui/table'
import { ALERT_LEVEL, formatDate } from 'lib/utils'
import { ApprovalFlowViewer } from 'components/approval/flow-viewer'
import type { FlowGraph, NodeProgressState } from 'lib/approval-flow'
import { GET_ORDER, GET_PICK, GET_APPROVAL, TRACE_STOCK, SUBMIT, APPROVE, START_PICK, PICK, SHIP, COMPLETE } from './queries'
import { useAuth } from 'lib/auth'
import { canActOnAssignee } from 'lib/approval-flow'
import { PrintButton } from 'components/print-button'
import { LEGAL_PRINT_TEMPLATE } from 'lib/print-keys'

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
  const [scanQr, setScanQr] = useState('')
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmStock, setConfirmStock] = useState<SplitConfirmStock | null>(null)
  const [confirmQty, setConfirmQty] = useState(0)
  const [labelOpen, setLabelOpen] = useState(false)
  const [labelData, setLabelData] = useState<QrLabelData | null>(null)

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
  const lineRemaining = pickLine ? Number(pickLine.requestedQty) - Number(pickLine.pickedQty ?? 0) : 0

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
  const firstStop = suggestions[0] as Record<string, unknown> | undefined
  const allPicked = orderLines.length > 0 && orderLines.every((l) => Number(l.pickedQty ?? 0) >= Number(l.requestedQty))

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
        alert('未找到该二维码对应的库存')
        return
      }
      if (item.status !== 'IN_STOCK') {
        alert('该物资不在库，无法拣货')
        return
      }
      if (String(item.materialId) !== String(pickLine.materialId)) {
        alert('扫码物资与单据不匹配')
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
      alert(e instanceof Error ? e.message : '扫码核对失败')
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
        alert(payload.message)
      }
      setConfirmOpen(false)
      setConfirmStock(null)
      closePick()
      refetch()
    } catch (e) {
      alert(e instanceof Error ? e.message : '拣货失败')
    }
  }

  if (!order) return null

  return (
    <DocumentPage
      title={`出库单 ${String(order.orderNo ?? '')}`}
      backTo="/outbound"
      backLabel='出库管理'
      wide
      footer={
        <>
          {id && order.status !== 'DRAFT' && (
            <PrintButton templateKey={LEGAL_PRINT_TEMPLATE.PrintOutbound} documentId={id} />
          )}
          {order.status === 'DRAFT' && (
            <>
              <Button variant="outline" onClick={() => navigate(`/outbound/${id}/edit`)}><Pencil className="size-4" />编辑</Button>
              <Button onClick={async () => { await submitOrder({ variables: { input: { id } } }); refetch() }}>提交审核</Button>
            </>
          )}
          {order.status === 'PENDING' && myPendingTask && (
            <>
              <Button variant="destructive" onClick={async () => { await approveOrder({ variables: { input: { id }, approved: false, rejectReason: '不符合调拨条件' } }); refetch() }}>驳回</Button>
              <Button onClick={async () => { await approveOrder({ variables: { input: { id }, approved: true } }); refetch() }}>审核通过</Button>
            </>
          )}
          {order.status === 'APPROVED' && (
            <Button onClick={async () => { await startPick({ variables: { input: { id } } }); refetch() }}>开始拣货</Button>
          )}
          {order.status === 'PICKING' && allPicked && (
            <Button onClick={async () => { try { await shipOrder({ variables: { input: { id } } }); refetch() } catch (e) { alert(e instanceof Error ? e.message : '出库失败') } }}>确认出库</Button>
          )}
          {order.status === 'SHIPPED' && (
            <Button onClick={async () => { await completeOrder({ variables: { input: { id } } }); refetch() }}>完成单据</Button>
          )}
        </>
      }
    >
      <Card className="mb-6">
        <CardContent className="grid grid-cols-4 gap-4 pt-6 text-sm">
          <div><span className="text-muted-foreground">状态</span><p className="mt-1.5"><StatusBadge status={String(order.status)} /></p></div>
          <div><span className="text-muted-foreground">用途</span><p className="mt-1">{String(order.purpose ?? '—')}</p></div>
          <div><span className="text-muted-foreground">目的地</span><p className="mt-1">{String(order.destination ?? '—')}</p></div>
          <div><span className="text-muted-foreground">领用人</span><p className="mt-1">{String(order.recipient ?? '—')}</p></div>
        </CardContent>
      </Card>

      {approval?.flow?.graph && order.status !== 'DRAFT' && (
        <Card className="mb-6">
          <CardContent className="pt-6">
            <ApprovalFlowViewer graph={approval.flow.graph} progress={approval.progress} />
            {approval.tasks && approval.tasks.length > 0 && (
              <div className="mt-4 space-y-2 border-t pt-4">
                <p className="text-xs font-medium text-muted-foreground">审批记录</p>
                {approval.tasks.filter((t) => t.status !== 'PENDING').map((t) => (
                  <div key={t.id} className="flex justify-between text-xs">
                    <span>{t.nodeLabel} · {t.status === 'APPROVED' ? '通过' : '驳回'}</span>
                    <span className="text-muted-foreground">{t.actedBy?.name ?? '—'}{t.comment ? ` · ${t.comment}` : ''}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>物资</TableHead>
                <TableHead>申请数量</TableHead>
                <TableHead>已拣</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orderLines.map((line) => (
                <TableRow key={String(line.id)}>
                  <TableCell>{(line.material as { name?: string })?.name}</TableCell>
                  <TableCell>{String(line.requestedQty)} {(line.material as { unit?: string })?.unit}</TableCell>
                  <TableCell>{String(line.pickedQty ?? 0)}</TableCell>
                  <TableCell>
                    {order.status === 'PICKING' && Number(line.pickedQty ?? 0) < Number(line.requestedQty) && (
                      <Button variant="link" size="sm" className="h-auto p-0" onClick={() => openPick(line)}>FIFO拣货</Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {pickLine && (
        <Card className="mt-6 border-primary/30">
          <CardContent className="space-y-4 pt-6">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">FIFO 拣货 · {(pickLine.material as { name?: string })?.name}</h3>
              <Button variant="ghost" size="sm" onClick={closePick}>取消</Button>
            </div>

            {firstStop && (
              <div className="flex items-start gap-3 rounded-lg border border-primary/20 bg-primary/5 p-4">
                <MapPin className="mt-0.5 size-5 shrink-0 text-primary" />
                <div>
                  <p className="text-xs font-medium text-primary">智能指引 · 第 {String(firstStop.routeStep ?? 1)} 站</p>
                  <p className="mt-1 text-lg font-semibold">
                    {firstStop.zone ? `${String(firstStop.zone)}区 · ` : ''}{String(firstStop.shelfCode ?? '—')}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    建议拣取 {String(firstStop.pickQty)}，在库 {String((firstStop.stockItem as { quantity?: number })?.quantity ?? firstStop.available)}
                  </p>
                </div>
              </div>
            )}

            {suggestions.length > 0 && (
              <div className="rounded-lg border bg-muted/30 p-3 text-sm">
                <p className="mb-2 font-medium">
                  拣货路线（效期优先 · 同效期按货位就近）
                  {pickPayload?.routeTotal ? ` · 共 ${pickPayload.routeTotal} 站` : ''}
                </p>
                {suggestions.map((s, i) => {
                  const item = s.stockItem as Record<string, unknown>
                  const batch = item?.batch as { expiryDate?: string } | undefined
                  const level = String(s.expiryLevel)
                  return (
                    <div key={i} className="flex items-center justify-between gap-2 py-1 text-xs">
                      <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 font-medium tabular-nums">
                        {String(s.routeStep ?? i + 1)}
                      </span>
                      <span className="min-w-0 flex-1">
                        {s.zone ? `${String(s.zone)}区 · ` : ''}{String(s.shelfCode)} · 可拣 {String(s.pickQty)} · 效期 {batch?.expiryDate ? formatDate(batch.expiryDate) : '—'}
                      </span>
                      <span className={`shrink-0 rounded px-1.5 py-0.5 ${ALERT_LEVEL[level]?.color ?? 'bg-muted'}`}>{ALERT_LEVEL[level]?.label ?? level}</span>
                      <Button
                        variant="link"
                        size="sm"
                        className="h-auto shrink-0 p-0"
                        onClick={() => void openConfirmForQr(String(item?.qrCode ?? ''))}
                      >
                        选用'</Button>
                    </div>
                  )
                })}
                {(pickPayload?.shortage ?? 0) > 0 && (
                  <p className="mt-2 text-xs text-destructive">库存不足，尚缺 {pickPayload?.shortage}</p>
                )}
              </div>
            )}

            <div className="max-w-lg">
              <p className="mb-2 text-sm font-medium">扫码拣货</p>
              <QrScanInput
                value={scanQr}
                onChange={setScanQr}
                onSubmit={(qr) => void openConfirmForQr(qr)}
                disabled={tracing || picking}
                placeholder='扫描物资二维码，核对后进入拆零确认'
              />
              <p className="mt-2 text-xs text-muted-foreground">扫码后系统将弹出在库数量，通过数字键盘输入本次出库量</p>
            </div>
          </CardContent>
        </Card>
      )}

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
        description='拆零产生新库存单元，请打印标签贴于剩余物资'
      />
    </DocumentPage>
  )
}
