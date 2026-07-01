import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@apollo/client'
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
  DatePicker,
  todayDateStr,
  localDateToIso,
} from 'components/form-page'
import { SupplierSearchSelect } from 'components/supplier-search-select'
import { Input } from 'components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from 'components/ui/select'
import { CREATE, GET_SUPPLIERS, GET_MATERIALS, GET_WAREHOUSES, type InboundLineRow } from './queries'
import { warehouseCodeForCategoryZone } from 'lib/warehouse-layout'
import { InboundLinesEditor } from './inbound-lines-editor'
import type { ImportResult } from './inbound-import-panel'
import { useInboundDocumentImport } from './use-inbound-document-import'

const emptyLine = (): InboundLineRow => ({ materialId: '', expectedQty: 1, manufacturer: '' })

export default function InboundCreate() {
  const navigate = useNavigate()
  const [warehouseId, setWarehouseId] = useState('')
  const warehouseTouched = useRef(false)
  const [orderDate, setOrderDate] = useState(todayDateStr)
  const [plannedReceiveDate, setPlannedReceiveDate] = useState('')
  const [supplierId, setSupplierId] = useState('')
  const [contact, setContact] = useState('')
  const [phone, setPhone] = useState('')
  const [contractNo, setContractNo] = useState('')
  const [remark, setRemark] = useState('')
  const [lines, setLines] = useState<InboundLineRow[]>([emptyLine()])
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [formError, setFormError] = useState<string | null>(null)

  const { data: supData } = useQuery(GET_SUPPLIERS, { variables: { input: { take: 100 } } })
  const { data: whData } = useQuery(GET_WAREHOUSES)
  const { data: matData } = useQuery(GET_MATERIALS, { variables: { input: { take: 500 } } })
  const [createOrder, { loading }] = useMutation(CREATE, { refetchQueries: ['GetInboundOrders'] })

  const suppliers = (supData?.getSuppliers as { suppliers: Array<Record<string, unknown>> })?.suppliers ?? []
  const warehouses = (whData?.getWarehouses as { warehouses: Array<Record<string, unknown>> })?.warehouses ?? []
  const materials = (matData?.getMaterials as { materials: Array<Record<string, unknown>> })?.materials ?? []

  useEffect(() => {
    if (!supplierId) {
      setContact('')
      setPhone('')
      return
    }
    const supplier = suppliers.find((s) => String(s.id) === supplierId)
    if (!supplier) return
    setContact(String(supplier.contact ?? ''))
    setPhone(String(supplier.phone ?? ''))
  }, [supplierId, suppliers])

  useEffect(() => {
    if (!warehouseId && warehouses[0]) {
      setWarehouseId(String(warehouses[0].id))
    }
  }, [warehouseId, warehouses])

  useEffect(() => {
    if (warehouseTouched.current) return
    const firstLine = lines.find((l) => l.materialId)
    if (!firstLine) return
    const mat = materials.find((m) => String(m.id) === firstLine.materialId)
    const catZone = (mat?.category as { zone?: string } | undefined)?.zone
    const whCode = warehouseCodeForCategoryZone(catZone)
    const wh = warehouses.find((w) => String(w.code) === whCode)
    if (wh) setWarehouseId(String(wh.id))
  }, [lines, materials, warehouses])

  const handleParsed = useCallback((result: {
    rows: InboundLineRow[]
    unmatched: Array<{ hint: string; expectedQty: number }>
  }) => {
    const parsedLines = result.rows.map((r) => ({
      materialId: r.materialId,
      expectedQty: r.expectedQty,
      manufacturer: '',
    }))
    setLines((prev) => {
      const isBlank = prev.length <= 1 && !prev[0]?.materialId
      return isBlank ? parsedLines : [...prev.filter((l) => l.materialId), ...parsedLines]
    })
    setImportResult({ matched: parsedLines.length, unmatched: result.unmatched.length })
    setFormError(null)
  }, [])

  const documentImport = useInboundDocumentImport({ onParsed: handleParsed })

  useEffect(() => {
    if (!importResult || documentImport.parseError) return
    const timer = window.setTimeout(() => setImportResult(null), 5000)
    return () => window.clearTimeout(timer)
  }, [importResult, documentImport.parseError])

  const handleCreate = async () => {
    setFormError(null)
    if (!warehouseId) {
      setFormError('请选择收货仓库')
      return
    }
    if (!supplierId) {
      setFormError('请选择供应商')
      return
    }
    if (!lines.some((l) => l.materialId && l.expectedQty > 0)) {
      setFormError('请添加入库明细，或上传清单识别')
      return
    }
    try {
      const result = await createOrder({
        variables: {
          input: {
            type: 'PURCHASE',
            warehouseId,
            supplierId,
            contractNo: contractNo || undefined,
            contact: contact || undefined,
            phone: phone || undefined,
            remark: remark || undefined,
            orderDate: localDateToIso(orderDate),
            plannedReceiveDate: plannedReceiveDate ? localDateToIso(plannedReceiveDate) : undefined,
            lines: lines.filter((l) => l.materialId),
          },
        },
      })
      const order = result.data?.createInboundOrder as { id?: string }
      navigate(order?.id ? `/inbound/${order.id}` : '/inbound')
    } catch (e) {
      setFormError(e instanceof Error ? e.message : '保存失败')
    }
  }

  return (
    <FormPage
      mode="create"
      backTo="/inbound"
      backLabel="采购入库"
      wide
      onSubmit={handleCreate}
      onCancel={() => navigate('/inbound')}
      submitLoading={loading || documentImport.isParsing}
      submitTitle="创建"
    >
      {formError && (
        <p className="mb-3 px-1 text-sm text-destructive" role="alert">{formError}</p>
      )}

      <GroupedFormStack>
        <GroupedFormSection title="采购信息">
          <GroupedFormRow>
            <GroupedFormItem label="供应商" required>
              <SupplierSearchSelect
                suppliers={suppliers}
                value={supplierId}
                onChange={setSupplierId}
                placeholder="请选择"
                className={groupedFormSelectTriggerClass}
              />
            </GroupedFormItem>
            <GroupedFormItem label="采购合同号">
              <Input
                className={groupedFormInputClass}
                value={contractNo}
                onChange={(e) => setContractNo(e.target.value)}
                placeholder="选填"
              />
            </GroupedFormItem>
          </GroupedFormRow>
          <GroupedFormRow>
            <GroupedFormItem label="联系人">
              <Input
                className={groupedFormInputClass}
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                placeholder="选填"
              />
            </GroupedFormItem>
            <GroupedFormItem label="电话">
              <Input
                className={groupedFormInputClass}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="选填"
              />
            </GroupedFormItem>
          </GroupedFormRow>
          <GroupedFormRow>
            <GroupedFormItem label="入库日期" required>
              <InlineDatePicker value={orderDate} onChange={(v) => v && setOrderDate(v)} />
            </GroupedFormItem>
            <GroupedFormItem label="计划收货日期">
              <InlineDatePicker
                value={plannedReceiveDate || undefined}
                onChange={(v) => setPlannedReceiveDate(v ?? '')}
                placeholder="选填"
              />
            </GroupedFormItem>
          </GroupedFormRow>
          <GroupedFormItem label="收货仓库" required>
            <Select
              value={warehouseId || undefined}
              onValueChange={(v) => {
                warehouseTouched.current = true
                setWarehouseId(v)
              }}
            >
              <SelectTrigger className={groupedFormSelectTriggerClass}>
                <SelectValue placeholder="请选择" />
              </SelectTrigger>
              <SelectContent>
                {warehouses.map((w) => (
                  <SelectItem key={String(w.id)} value={String(w.id)}>{String(w.name)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </GroupedFormItem>
        </GroupedFormSection>

        <GroupedFormRemark
          value={remark}
          onChange={setRemark}
          placeholder="选填"
        />

        <InboundLinesEditor
          lines={lines}
          materials={materials}
          onChange={setLines}
          onAddLine={() => setLines([...lines, emptyLine()])}
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
