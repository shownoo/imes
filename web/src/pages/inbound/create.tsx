import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@apollo/client'
import { FormPage, FormField, FormGrid } from 'components/form-page'
import { Button } from 'components/common'
import { Input } from 'components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from 'components/ui/select'
import { CREATE, GET_SUPPLIERS, GET_MATERIALS, type InboundLineRow } from './queries'
import { InboundLinesEditor } from './inbound-lines-editor'
import type { ImportResult } from './inbound-import-panel'
import { useInboundDocumentImport } from './use-inbound-document-import'

const emptyLine = (): InboundLineRow => ({ materialId: '', expectedQty: 1 })

export default function InboundCreate() {
  const navigate = useNavigate()
  const [supplierId, setSupplierId] = useState('')
  const [contractNo, setContractNo] = useState('')
  const [remark, setRemark] = useState('')
  const [lines, setLines] = useState<InboundLineRow[]>([emptyLine()])
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [formError, setFormError] = useState<string | null>(null)

  const { data: supData } = useQuery(GET_SUPPLIERS, { variables: { input: { take: 100 } } })
  const { data: matData } = useQuery(GET_MATERIALS, { variables: { input: { take: 500 } } })
  const [createOrder, { loading }] = useMutation(CREATE, { refetchQueries: ['GetInboundOrders'] })

  const suppliers = (supData?.getSuppliers as { suppliers: Array<Record<string, unknown>> })?.suppliers ?? []
  const materials = (matData?.getMaterials as { materials: Array<Record<string, unknown>> })?.materials ?? []

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
    if (!lines.some((l) => l.materialId && l.expectedQty > 0)) {
      setFormError('请添加入库明细，或上传清单识别')
      return
    }
    try {
      const result = await createOrder({
        variables: {
          input: {
            type: 'PURCHASE',
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
      setFormError(e instanceof Error ? e.message : '创建失败')
    }
  }

  return (
    <FormPage
      title='新建采购入库单'
      backTo="/inbound"
      backLabel='采购入库'
      wide
      footer={
        <>
          <Button variant="outline" onClick={() => navigate('/inbound')}>取消'</Button>
          <Button onClick={handleCreate} disabled={loading || documentImport.isParsing}>创建</Button>
        </>
      }
    >
      {formError && (
        <p className="mb-5 text-sm text-destructive" role="alert">{formError}</p>
      )}

      <FormGrid className="mb-10 grid-cols-1 gap-x-10 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
          <FormField label='供应商'>
            <Select value={supplierId || 'none'} onValueChange={(v) => setSupplierId(v === 'none' ? '' : v)}>
              <SelectTrigger><SelectValue placeholder='请选择' /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">请选择</SelectItem>
                {suppliers.map((s) => <SelectItem key={String(s.id)} value={String(s.id)}>{String(s.name)}</SelectItem>)}
              </SelectContent>
            </Select>
          </FormField>
          <FormField label='采购合同号'>
            <Input value={contractNo} onChange={(e) => setContractNo(e.target.value)} placeholder='选填' />
          </FormField>
          <FormField label='备注' className="sm:col-span-2 lg:col-span-1">
            <Input value={remark} onChange={(e) => setRemark(e.target.value)} placeholder='选填' />
          </FormField>
      </FormGrid>

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
    </FormPage>
  )
}
