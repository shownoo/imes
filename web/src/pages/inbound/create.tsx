import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@apollo/client'
import {
  FormPage,
  FormSection,
  FormStack,
  InsetFormGroup,
  InsetFormRow,
  insetFormInputClass,
  insetFormSelectTriggerClass,
} from 'components/form-page'
import { FormProcessButtons } from 'components/form-process-buttons'
import { Input } from 'components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from 'components/ui/select'
import { CREATE, GET_SUPPLIERS, GET_MATERIALS, GET_WAREHOUSES, type InboundLineRow } from './queries'
import { warehouseCodeForCategoryZone } from 'lib/warehouse-layout'
import { InboundLinesEditor } from './inbound-lines-editor'
import type { ImportResult } from './inbound-import-panel'
import { useInboundDocumentImport } from './use-inbound-document-import'

const emptyLine = (): InboundLineRow => ({ materialId: '', expectedQty: 1 })

export default function InboundCreate() {
  const navigate = useNavigate()
  const [warehouseId, setWarehouseId] = useState('')
  const warehouseTouched = useRef(false)
  const [supplierId, setSupplierId] = useState('')
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
    if (!warehouseId && warehouses[0]) {
      setWarehouseId(String(warehouses[0].id))
    }
  }, [warehouses, warehouseId])

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
            supplierId: supplierId || undefined,
            contractNo: contractNo || undefined,
            remark: remark || undefined,
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
      footer={
        <FormProcessButtons
          onCancel={() => navigate('/inbound')}
          onSubmit={handleCreate}
          loading={loading || documentImport.isParsing}
        />
      }
    >
      {formError && (
        <p className="text-sm text-destructive" role="alert">{formError}</p>
      )}

      <FormStack>
        <FormSection
          title="采购信息"
          desc="收货仓库、供应商与合同信息"
          tip="选物资后，收货仓库将按物资大类自动推荐"
          inset
          narrow
        >
          <InsetFormGroup>
            <InsetFormRow label="收货仓库" required>
              <Select
                value={warehouseId || undefined}
                onValueChange={(v) => {
                  warehouseTouched.current = true
                  setWarehouseId(v)
                }}
              >
                <SelectTrigger className={insetFormSelectTriggerClass}>
                  <SelectValue placeholder="请选择" />
                </SelectTrigger>
                <SelectContent>
                  {warehouses.map((w) => (
                    <SelectItem key={String(w.id)} value={String(w.id)}>{String(w.name)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </InsetFormRow>
            <InsetFormRow label="供应商">
              <Select value={supplierId || undefined} onValueChange={setSupplierId}>
                <SelectTrigger className={insetFormSelectTriggerClass}>
                  <SelectValue placeholder="请选择" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map((s) => (
                    <SelectItem key={String(s.id)} value={String(s.id)}>{String(s.name)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </InsetFormRow>
            <InsetFormRow label="采购合同号">
              <Input
                className={insetFormInputClass}
                value={contractNo}
                onChange={(e) => setContractNo(e.target.value)}
                placeholder="选填"
              />
            </InsetFormRow>
            <InsetFormRow label="备注">
              <Input
                className={insetFormInputClass}
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
                placeholder="选填"
              />
            </InsetFormRow>
          </InsetFormGroup>
        </FormSection>

        <FormSection title="入库明细" desc="选择物资并填写预期数量，可上传清单识别">
          <InboundLinesEditor
            hideTitle
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
        </FormSection>
      </FormStack>
    </FormPage>
  )
}
