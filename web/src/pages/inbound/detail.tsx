import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams, useSearchParams } from 'react-router-dom'
import { useQuery, useMutation } from '@apollo/client'
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
import { InboundStatusBadge } from 'components/inbound-status-badge'
import { QrLabelDialog } from 'components/qr-label-dialog'
import type { QrLabelData } from 'components/qr-label'
import { stockItemToLabel } from 'components/qr-label'
import { ReceiveCodingPanel, type ReceiveCodingForm, type ReceivedBatchRow } from 'components/receive-coding-panel'
import { ApprovalFlowViewer } from 'components/approval/flow-viewer'
import type { FlowGraph, NodeProgressState } from 'lib/approval-flow'
import { canActOnAssignee } from 'lib/approval-flow'
import { useAuth } from 'lib/auth'
import { GET_ORDER, GET_APPROVAL, SUBMIT, APPROVE, REJECT, RECEIVE, COMPLETE } from './queries'
import { ReceiveLinesTable, linePending } from './receive-lines-table'
import { ReceiveSummaryPanel } from './receive-summary'
import { PrintButton } from 'components/print-button'
import { LEGAL_PRINT_TEMPLATE } from 'lib/print-keys'
import { MessageAlert } from 'components/message-alert'
import { CollabNotice } from 'components/collab-notice'
import { formatDate } from 'lib/utils'
import { useDocumentRealtime } from 'hooks/use-document-realtime'
import { useMobileOpsUi } from 'hooks/use-mobile-ops-ui'
import InboundMobileDetail from './mobile/detail'

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

export default function InboundDetail() {
  const { t } = useTranslation()
  const mobileOps = useMobileOpsUi()
  if (mobileOps) return <InboundMobileDetail />

  return <InboundDesktopDetail />
}

function InboundDesktopDetail() {
  const { t } = useTranslation()
  const { id } = useParams()
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const receiveLineId = searchParams.get('receive')
  const panelRef = useRef<HTMLDivElement>(null)

  const { data, refetch } = useQuery(GET_ORDER, { variables: { input: { id } }, skip: !id })
  const { notice: collabNotice } = useDocumentRealtime('inbound', id, () => void refetch())
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
  const warehouseName = (order?.warehouse as { name?: string })?.name

  const [receiveForm, setReceiveForm] = useState<ReceiveCodingForm>({
    actualQty: 0,
    batchNo: '',
    productionDate: new Date().toISOString().slice(0, 10),
  })
  const [labelOpen, setLabelOpen] = useState(false)
  const [labelData, setLabelData] = useState<QrLabelData | null>(null)
  const [pageMessage, setPageMessage] = useState<PageMessage | null>(null)

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

  const showMessage = (msg: PageMessage) => setPageMessage(msg)

  const handleReceive = async () => {
    if (!receiveLine || !id) return
    const pending = linePending(receiveLine)
    if (receiveForm.actualQty <= 0 || receiveForm.actualQty > pending) {
      showMessage({
        title: t('数量不正确'),
        description: `实收数量须在 1～${pending.toLocaleString()} 之间。`,
      })
      return
    }
    if (!receiveForm.batchNo.trim()) {
      showMessage({
        title: t('请填写批次号'),
        description: t('请录入外包装批次号，与送货单或标签保持一致。'),
      })
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
      showMessage({
        title: t('收货失败'),
        description: e instanceof Error ? e.message : '操作失败，请稍后重试',
      })
    }
  }

  const handleComplete = async () => {
    if (!id) return
    const incomplete = orderLines.filter((line) => linePending(line) > 0)
    if (incomplete.length > 0) {
      showMessage({
        title: t('无法完成入库'),
        description: (
          <>
            <p className="mb-2.5">{t('以下明细尚未收齐，请先完成收货赋码：')}</p>
            <ul className="divide-y divide-border/35 overflow-hidden rounded-lg border border-border/50 bg-muted/25">
              {incomplete.map((line) => {
                const material = line.material as { name?: string; unit?: string }
                const pending = linePending(line)
                return (
                  <li key={String(line.id)} className="flex items-center justify-between gap-3 px-3 py-2 text-[13px]">
                    <span className="truncate font-medium text-foreground">{material?.name ?? '—'}</span>
                    <span className="shrink-0 tabular-nums text-amber-600">
                      待收 {pending.toLocaleString()}{material?.unit ? ` ${material.unit}` : ''}
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
      await completeOrder({ variables: { input: { id } } })
      refetch()
    } catch (e) {
      showMessage({
        title: t('无法完成入库'),
        description: e instanceof Error ? e.message : '操作失败，请稍后重试',
      })
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

  const showReceiveSummary = order.status === 'RECEIVING' || order.status === 'COMPLETED'
  const isReceiving = order.status === 'RECEIVING'
  const linesTip = isReceiving && warehouseName
    ? `上架时请扫描「${warehouseName}」下的货位码`
    : undefined

  return (
    <DocumentPage
      title={String(order.orderNo ?? '')}
      backTo="/inbound"
      backLabel={t('采购入库')}
      wide
      footer={
        <>
          {id && order.status !== 'DRAFT' && (
            <PrintButton templateKey={LEGAL_PRINT_TEMPLATE.PrintInbound} documentId={id} />
          )}
          {order.status === 'DRAFT' && (
            <Button size="sm" onClick={async () => { await submitOrder({ variables: { input: { id } } }); refetch() }}>提交审核</Button>
          )}
          {order.status === 'PENDING' && myPendingTask && (
            <>
              <Button size="sm" variant="destructive" onClick={async () => { await rejectOrder({ variables: { input: { id }, reason: '不符合采购要求' } }); refetch() }}>驳回</Button>
              <Button size="sm" onClick={async () => { await approveOrder({ variables: { input: { id } } }); refetch() }}>审核通过</Button>
            </>
          )}
          {isReceiving && (
            <Button size="sm" onClick={() => void handleComplete()}>完成入库</Button>
          )}
        </>
      }
    >
      <CollabNotice message={collabNotice} className="mb-4" />
      <GroupedFormStack>
        <GroupedFormSection title={t('采购信息')}>
          <GroupedFormRow>
            <GroupedFormItem label={t('供应商')}>
              <GroupedFormReadonlyField>
                {(order.supplier as { name?: string })?.name ?? '—'}
              </GroupedFormReadonlyField>
            </GroupedFormItem>
            <GroupedFormItem label={t('采购合同号')}>
              <GroupedFormReadonlyField>{String(order.contractNo ?? '—')}</GroupedFormReadonlyField>
            </GroupedFormItem>
          </GroupedFormRow>
          <GroupedFormRow>
            <GroupedFormItem label={t('联系人')}>
              <GroupedFormReadonlyField>{String(order.contact ?? '—')}</GroupedFormReadonlyField>
            </GroupedFormItem>
            <GroupedFormItem label={t('电话')}>
              <GroupedFormReadonlyField>{String(order.phone ?? '—')}</GroupedFormReadonlyField>
            </GroupedFormItem>
          </GroupedFormRow>
          <GroupedFormRow>
            <GroupedFormItem label={t('创建日期')}>
              <GroupedFormReadonlyField>
                {formatDate(String(order.orderDate ?? order.createdAt))}
              </GroupedFormReadonlyField>
            </GroupedFormItem>
            <GroupedFormItem label={t('计划收货日期')}>
              <GroupedFormReadonlyField>
                {order.plannedReceiveDate ? formatDate(String(order.plannedReceiveDate)) : '—'}
              </GroupedFormReadonlyField>
            </GroupedFormItem>
          </GroupedFormRow>
          <GroupedFormRow>
            <GroupedFormItem label={t('收货仓库')}>
              <GroupedFormReadonlyField>{warehouseName ?? '—'}</GroupedFormReadonlyField>
            </GroupedFormItem>
            <GroupedFormItem label={t('状态')}>
              <GroupedFormReadonlyField className="border-0 bg-transparent px-1 shadow-none">
                <InboundStatusBadge order={{ status: order.status, lines: orderLines as { expectedQty: number; actualQty?: number | null }[] }} />
              </GroupedFormReadonlyField>
            </GroupedFormItem>
          </GroupedFormRow>
          {showReceiveSummary && (
            <ReceiveSummaryPanel lines={orderLines} receiving={isReceiving} embedded compact />
          )}
        </GroupedFormSection>

        {approval?.flow?.graph && order.status !== 'DRAFT' && (
          <GroupedFormSection title={t('审批流程')}>
            <GroupedFormItem>
              <ApprovalFlowViewer graph={approval.flow.graph} progress={approval.progress} />
            </GroupedFormItem>
          </GroupedFormSection>
        )}

        <DocumentLinesSection
          title={t('入库清单')}
          caption={linesTip}
          trailing={orderLines.length > 0 ? (
            <span className="text-xs tabular-nums text-muted-foreground">{orderLines.length} 行</span>
          ) : undefined}
        >
          <ReceiveLinesTable
            lines={orderLines}
            receiving={isReceiving}
            orderCompleted={order.status === 'COMPLETED'}
            activeLineId={receiveLineId}
            onReceive={openReceive}
            onReprint={handleReprint}
          />
        </DocumentLinesSection>

        {receiveLine && (
          <div ref={panelRef}>
            <ReceiveCodingPanel
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
              onSubmit={handleReceive}
              submitting={receiving}
            />
          </div>
        )}
      </GroupedFormStack>

      <QrLabelDialog
        open={labelOpen}
        onOpenChange={setLabelOpen}
        label={labelData}
        description={t('收货赋码成功，请打印标签贴于物资外包装')}
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
