import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation } from '@apollo/client'
import { format } from 'date-fns'
import {
  FormPage,
  GroupedFormSection,
  GroupedFormRow,
  GroupedFormItem,
  GroupedFormStack,
  GroupedFormRemark,
  groupedFormInputClass,
  groupedFormSelectTriggerClass,
  InlineDatePicker,
  localDateToIso,
  todayDateStr,
} from 'components/form-page'
import { Input } from 'components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from 'components/ui/select'
import { CREATE, UPDATE, GET_ORDER, GET_MATERIALS, GET_OUTBOUND_PURPOSES, GET_OUTBOUND_DESTINATIONS, emptyOutboundForm, type OutboundLineRow } from './queries'
import { OutboundLinesEditor } from './outbound-lines-editor'
import { useOutboundDocumentImport } from './use-outbound-document-import'
import type { ImportResult } from '../inbound/inbound-import-panel'

const emptyLine = (): OutboundLineRow => ({ materialId: '', requestedQty: 1 })

function matchPurposeId(purposes: Array<Record<string, unknown>>, purposeText?: string | null) {
  const { t } = useTranslation()
  if (!purposeText) return ''
  const exact = purposes.find((p) => String(p.name) === purposeText)
  if (exact) return String(exact.id)
  const partial = purposes.find((p) => purposeText.startsWith(String(p.name)))
  return partial ? String(partial.id) : ''
}

function matchDestinationId(destinations: Array<Record<string, unknown>>, destinationText?: string | null) {
  const { t } = useTranslation()
  if (!destinationText) return ''
  const exact = destinations.find((d) => String(d.name) === destinationText)
  if (exact) return String(exact.id)
  const partial = destinations.find((d) => destinationText.startsWith(String(d.name)) || String(d.name).startsWith(destinationText))
  return partial ? String(partial.id) : ''
}

export default function OutboundForm() {
  const { t } = useTranslation()
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)
  const [form, setForm] = useState(() => ({ ...emptyOutboundForm(), orderDate: todayDateStr() }))
  const [formError, setFormError] = useState<string | null>(null)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)

  const { data: orderData } = useQuery(GET_ORDER, { skip: !id, variables: { input: { id } } })
  const { data: matData } = useQuery(GET_MATERIALS, { variables: { input: { take: 500 } } })
  const { data: purposeData } = useQuery(GET_OUTBOUND_PURPOSES, { variables: { enabledOnly: true, input: { take: 200 } } })
  const { data: destinationData } = useQuery(GET_OUTBOUND_DESTINATIONS, {
    variables: { enabledOnly: true, useOrgCity: true, input: { take: 200 } },
  })
  const [createOrder, { loading: creating }] = useMutation(CREATE, { refetchQueries: ['GetOutboundOrders'] })
  const [updateOrder, { loading: updating }] = useMutation(UPDATE, { refetchQueries: ['GetOutboundOrders'] })

  const materials = (matData?.getMaterials as { materials: Array<Record<string, unknown>> })?.materials ?? []
  const purposes = (purposeData?.getOutboundPurposes as { purposes: Array<Record<string, unknown>> })?.purposes ?? []
  const destinations = (destinationData?.getOutboundDestinations as { destinations: Array<Record<string, unknown>> })?.destinations ?? []
  const order = orderData?.getOutboundOrder as Record<string, unknown> | undefined

  const purposeOptions = useMemo(
    () => purposes.map((p) => ({ id: String(p.id), name: String(p.name) })),
    [purposes],
  )
  const destinationOptions = useMemo(
    () => destinations.map((d) => ({
      id: String(d.id),
      name: String(d.name),
      label: `${String(d.district ?? d.name)} · ${String(d.name)}`,
    })),
    [destinations],
  )

  useEffect(() => {
    if (order && isEdit) {
      const rowLines = (order.lines as Array<Record<string, unknown>>) ?? []
      setForm({
        purposeId: matchPurposeId(purposes, String(order.purpose ?? '')),
        destinationId: matchDestinationId(destinations, String(order.destination ?? '')),
        contact: String(order.contact ?? ''),
        phone: String(order.phone ?? ''),
        orderDate: order.orderDate
          ? format(new Date(String(order.orderDate)), 'yyyy-MM-dd')
          : order.createdAt
            ? format(new Date(String(order.createdAt)), 'yyyy-MM-dd')
            : todayDateStr(),
        plannedShipDate: order.plannedShipDate
          ? format(new Date(String(order.plannedShipDate)), 'yyyy-MM-dd')
          : '',
        remark: String(order.remark ?? ''),
        lines: rowLines.length
          ? rowLines.map((l) => ({ materialId: String(l.materialId), requestedQty: Number(l.requestedQty) }))
          : [emptyLine()],
      })
    }
  }, [order, isEdit, purposes, destinations])

  const handleParsed = useCallback((result: {
    rows: Array<{ materialId: string; requestedQty: number }>
    unmatched: Array<{ hint: string; expectedQty: number }>
  }) => {
    const parsedLines = result.rows.map((r) => ({
      materialId: r.materialId,
      requestedQty: r.requestedQty,
    }))
    setForm((prev) => {
      const isBlank = prev.lines.length <= 1 && !prev.lines[0]?.materialId
      const nextLines = isBlank
        ? parsedLines
        : [...prev.lines.filter((l) => l.materialId), ...parsedLines]
      return { ...prev, lines: nextLines.length ? nextLines : [emptyLine()] }
    })
    setImportResult({ matched: parsedLines.length, unmatched: result.unmatched.length })
    setFormError(null)
  }, [])

  const documentImport = useOutboundDocumentImport({ onParsed: handleParsed })

  useEffect(() => {
    if (!importResult || documentImport.parseError) return
    const timer = window.setTimeout(() => setImportResult(null), 5000)
    return () => window.clearTimeout(timer)
  }, [importResult, documentImport.parseError])

  const handleDestinationChange = (destinationId: string) => {
    const dest = destinations.find((d) => String(d.id) === destinationId)
    setForm({
      ...form,
      destinationId,
      contact: dest ? String(dest.contact ?? '') : '',
      phone: dest ? String(dest.phone ?? '') : '',
    })
  }

  const handleSave = async () => {
    setFormError(null)
    if (!form.purposeId) {
      setFormError('请选择用途')
      return
    }
    if (!form.lines.some((l) => l.materialId && l.requestedQty > 0)) {
      setFormError('请添加出库明细，或上传清单识别')
      return
    }
    const optionalText = (v: string) => v || (isEdit ? null : undefined)
    const payload = {
      purposeId: form.purposeId,
      destinationId: form.destinationId || undefined,
      contact: form.contact || undefined,
      phone: form.phone || undefined,
      orderDate: form.orderDate ? localDateToIso(form.orderDate) : undefined,
      plannedShipDate: form.plannedShipDate ? localDateToIso(form.plannedShipDate) : undefined,
      remark: optionalText(form.remark),
      lines: form.lines.filter((l) => l.materialId),
    }
    try {
      if (isEdit) {
        await updateOrder({ variables: { input: { id, ...payload } } })
        navigate(`/outbound/${id}`)
      } else {
        const result = await createOrder({ variables: { input: payload } })
        const created = result.data?.createOutboundOrder as { id?: string }
        navigate(created?.id ? `/outbound/${created.id}` : '/outbound')
      }
    } catch (e) {
      setFormError(e instanceof Error ? e.message : '保存失败')
    }
  }

  const setLines = (lines: OutboundLineRow[]) => setForm({ ...form, lines })

  return (
    <FormPage
      mode={isEdit ? 'edit' : 'create'}
      title={isEdit ? '编辑出库单' : '新增出库单'}
      backTo={isEdit ? `/outbound/${id}` : '/outbound'}
      backLabel={t('出库管理')}
      wide
      onSubmit={handleSave}
      onCancel={() => navigate(isEdit ? `/outbound/${id}` : '/outbound')}
      submitLoading={creating || updating || documentImport.isParsing}
      submitTitle={isEdit ? '保存' : '创建'}
    >
      {formError && (
        <p className="mb-3 px-1 text-sm text-destructive" role="alert">{formError}</p>
      )}

      <GroupedFormStack>
        <GroupedFormSection title={t('出库信息')}>
          <GroupedFormRow>
            <GroupedFormItem label={t('用途')} required>
              <Select value={form.purposeId} onValueChange={(v) => setForm({ ...form, purposeId: v })}>
                <SelectTrigger className={groupedFormSelectTriggerClass}>
                  <SelectValue placeholder={t('请选择出库用途')} />
                </SelectTrigger>
                <SelectContent>
                  {purposeOptions.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </GroupedFormItem>
            <GroupedFormItem label={t('领用人')}>
              <Select value={form.destinationId} onValueChange={handleDestinationChange}>
                <SelectTrigger className={groupedFormSelectTriggerClass}>
                  <SelectValue placeholder={t('请选择领用人')} />
                </SelectTrigger>
                <SelectContent>
                  {destinationOptions.map((d) => (
                    <SelectItem key={d.id} value={d.id}>{d.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </GroupedFormItem>
          </GroupedFormRow>
          <GroupedFormRow>
            <GroupedFormItem label={t('联系人')}>
              <Input
                className={groupedFormInputClass}
                value={form.contact}
                onChange={(e) => setForm({ ...form, contact: e.target.value })}
                placeholder={t('选填')}
              />
            </GroupedFormItem>
            <GroupedFormItem label={t('电话')}>
              <Input
                className={groupedFormInputClass}
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder={t('选填')}
              />
            </GroupedFormItem>
          </GroupedFormRow>
          <GroupedFormRow>
            <GroupedFormItem label={t('创建日期')} required>
              <InlineDatePicker
                value={form.orderDate || undefined}
                onChange={(v) => setForm({ ...form, orderDate: v ?? '' })}
              />
            </GroupedFormItem>
            <GroupedFormItem label={t('计划发货日期')}>
              <InlineDatePicker
                value={form.plannedShipDate || undefined}
                onChange={(v) => setForm({ ...form, plannedShipDate: v ?? '' })}
                placeholder={t('选填')}
              />
            </GroupedFormItem>
          </GroupedFormRow>
        </GroupedFormSection>

        <GroupedFormRemark
          value={form.remark}
          onChange={(v) => setForm({ ...form, remark: v })}
          placeholder={t('选填')}
        />

        <OutboundLinesEditor
          lines={form.lines}
          materials={materials}
          onChange={setLines}
          onAddLine={() => setLines([...form.lines, emptyLine()])}
          importProps={{
            isParsing: documentImport.isParsing,
            parsingKind: documentImport.parsingKind,
            parseError: documentImport.parseError,
            result: importResult,
            onImportPdf: documentImport.importPdf,
            onImportImage: documentImport.importImage,
            onDismissError: documentImport.clearError,
          }}
        />
      </GroupedFormStack>
    </FormPage>
  )
}
