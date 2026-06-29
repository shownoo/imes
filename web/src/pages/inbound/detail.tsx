import { useEffect, useRef, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { useQuery, useMutation } from '@apollo/client'
import { DocumentPage } from 'components/form-page'
import { Button, Card, CardContent } from 'components/common'
import { StatusBadge } from 'components/status-badge'
import { QrLabelDialog } from 'components/qr-label-dialog'
import type { QrLabelData } from 'components/qr-label'
import { stockItemToLabel } from 'components/qr-label'
import { ReceiveCodingPanel, type ReceiveCodingForm } from 'components/receive-coding-panel'
import { ApprovalFlowViewer } from 'components/approval/flow-viewer'
import type { FlowGraph, NodeProgressState } from 'lib/approval-flow'
import { canActOnAssignee } from 'lib/approval-flow'
import { useAuth } from 'lib/auth'
import { GET_ORDER, GET_APPROVAL, SUBMIT, APPROVE, REJECT, RECEIVE, COMPLETE } from './queries'
import { ReceiveLinesTable, linePending } from './receive-lines-table'
import { PrintButton } from 'components/print-button'
import { LEGAL_PRINT_TEMPLATE } from 'lib/print-keys'

export default function InboundDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const receiveLineId = searchParams.get('receive')
  const panelRef = useRef<HTMLDivElement>(null)

  const { data, refetch } = useQuery(GET_ORDER, { variables: { input: { id } }, skip: !id })
  const { data: approvalData } = useQuery(GET_APPROVAL, {
    variables: { bizType: 'inbound', bizId: id! },
    skip: !id || !data?.getInboundOrder,
  })
  const refetchOpts = { refetchQueries: ['GetInboundOrders', 'GetInboundOrder'] }
  const [submitOrder] = useMutation(SUBMIT, refetchOpts)
  const [approveOrder] = useMutation(APPROVE, refetchOpts)
  const [rejectOrder] = useMutation(REJECT, refetchOpts)
  const [receiveLineMut, { loading: receiving }] = useMutation(RECEIVE, refetchOpts)
  const [completeOrder] = useMutation(COMPLETE, refetchOpts)

  const order = data?.getInboundOrder as Record<string, unknown> | undefined
  const approval = approvalData?.getApprovalInstance as {
    flow?: { graph?: FlowGraph }
    progress?: Array<{ id: string; state: NodeProgressState }>
    tasks?: Array<{ id: string; nodeLabel?: string; status: string; assigneeRole?: string; actedBy?: { name?: string }; comment?: string }>
  } | null
  const myPendingTask = approval?.tasks?.find(
    (t) => t.status === 'PENDING' && canActOnAssignee(user?.role ?? '', t.assigneeRole),
  )
  const orderLines = (order?.lines as Array<Record<string, unknown>>) ?? []
  const receiveLine = receiveLineId ? orderLines.find((l) => String(l.id) === receiveLineId) : null

  const [receiveForm, setReceiveForm] = useState<ReceiveCodingForm>({
    actualQty: 0,
    batchNo: '',
    productionDate: new Date().toISOString().slice(0, 10),
  })
  const [labelOpen, setLabelOpen] = useState(false)
  const [labelData, setLabelData] = useState<QrLabelData | null>(null)

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

  useEffect(() => {
    if (!receiveLineId) return
    panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [receiveLineId])

  const handleReceive = async () => {
    if (!receiveLine || !id) return
    const pending = linePending(receiveLine)
    if (receiveForm.actualQty <= 0 || receiveForm.actualQty > pending) {
      alert(`实收数量须在 1～${pending} 之间`)
      return
    }
    if (!receiveForm.batchNo.trim()) {
      alert('请填写生产批次号')
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
      const payload = result.data?.receiveInboundLine as {
        qrCode?: string
        stockItem?: { quantity?: number }
      } | undefined
      const material = receiveLine.material as { name?: string; unit?: string }
      if (payload?.qrCode) {
        setLabelData({
          qrCode: payload.qrCode,
          title: material?.name ?? '应急物资',
          subtitle: `批次 ${receiveForm.batchNo.trim()}`,
          meta: [`数量 ${receiveForm.actualQty}${material?.unit ?? ''}`, '采购入库'],
        })
        setLabelOpen(true)
      }
      closeReceive()
      refetch()
    } catch (e) {
      alert(e instanceof Error ? e.message : '收货失败')
    }
  }

  const handleReprint = (_line: Record<string, unknown>, stockItem: Record<string, unknown>) => {
    const label = stockItemToLabel(stockItem)
    setLabelData({
      ...label,
      meta: [...(label.meta ?? []), '采购入库'],
    })
    setLabelOpen(true)
  }

  if (!order) return null

  const receiveMaterial = receiveLine?.material as {
    name?: string
    unit?: string
    category?: { shelfLifeMonths?: number | null }
  } | undefined

  return (
    <DocumentPage
      title={`采购入库单 ${String(order.orderNo ?? '')}`}
      backTo="/inbound"
      backLabel='采购入库'
      wide
      footer={
        <>
          {id && order.status !== 'DRAFT' && (
            <PrintButton templateKey={LEGAL_PRINT_TEMPLATE.PrintInbound} documentId={id} />
          )}
          {order.status === 'DRAFT' && (
            <Button onClick={async () => { await submitOrder({ variables: { input: { id } } }); refetch() }}>提交审核</Button>
          )}
          {order.status === 'PENDING' && myPendingTask && (
            <>
              <Button variant="destructive" onClick={async () => { await rejectOrder({ variables: { input: { id }, reason: '不符合采购要求' } }); refetch() }}>驳回</Button>
              <Button onClick={async () => { await approveOrder({ variables: { input: { id } } }); refetch() }}>审核通过</Button>
            </>
          )}
          {order.status === 'RECEIVING' && (
            <Button onClick={async () => { try { await completeOrder({ variables: { input: { id } } }); refetch() } catch (e) { alert(e instanceof Error ? e.message : '无法完成') } }}>完成入库</Button>
          )}
        </>
      }
    >
      <Card className="leader-panel-card mb-4">
        <CardContent className="grid grid-cols-3 gap-4 pt-6 text-sm">
          <div><span className="text-muted-foreground">'状态'</span><p className="mt-1.5"><StatusBadge status={String(order.status)} /></p></div>
          <div><span className="text-muted-foreground">'供应商'</span><p className="mt-1">{(order.supplier as { name?: string })?.name ?? '—'}</p></div>
          <div><span className="text-muted-foreground">'合同号'</span><p className="mt-1">{String(order.contractNo ?? '—')}</p></div>
        </CardContent>
      </Card>

      {approval?.flow?.graph && order.status !== 'DRAFT' && (
        <Card className="leader-panel-card mb-4">
          <CardContent className="pt-6">
            <ApprovalFlowViewer graph={approval.flow.graph} progress={approval.progress} />
            {approval.tasks && approval.tasks.some((t) => t.status !== 'PENDING') && (
              <div className="mt-4 space-y-2 border-t pt-4">
                <p className="text-xs font-medium text-muted-foreground">'审批记录'</p>
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

      <ReceiveLinesTable
        lines={orderLines}
        receiving={order.status === 'RECEIVING'}
        activeLineId={receiveLineId}
        onReceive={openReceive}
        onReprint={handleReprint}
      />

      {receiveLine && (
        <div ref={panelRef} className="mt-4">
          <ReceiveCodingPanel
            materialName={receiveMaterial?.name ?? '—'}
            unit={receiveMaterial?.unit}
            pendingQty={linePending(receiveLine)}
            shelfLifeMonths={receiveMaterial?.category?.shelfLifeMonths}
            value={receiveForm}
            onChange={setReceiveForm}
            onCancel={closeReceive}
            onSubmit={handleReceive}
            submitting={receiving}
          />
        </div>
      )}

      <QrLabelDialog
        open={labelOpen}
        onOpenChange={setLabelOpen}
        label={labelData}
        description='收货赋码成功，请打印标签贴于物资外包装'
      />
    </DocumentPage>
  )
}
