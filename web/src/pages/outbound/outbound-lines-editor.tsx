import { MaterialLinesEditor } from 'components/material-lines-editor'
import { DocumentLinesSection } from 'components/form-page'
import { InboundImportActions, type ImportResult } from '../inbound/inbound-import-panel'
import type { OutboundLineRow } from './queries'
import type { MaterialOption } from 'components/material-lines-editor'

export function OutboundLinesEditor({
  lines,
  materials,
  onChange,
  onAddLine,
  importProps,
}: {
  lines: OutboundLineRow[]
  materials: MaterialOption[]
  onChange: (lines: OutboundLineRow[]) => void
  onAddLine: () => void
  importProps: {
    isParsing: boolean
    parsingKind: 'pdf' | 'image' | null
    parseError: string | null
    result: ImportResult | null
    onImportPdf: (file: File) => Promise<void>
    onImportImage: (file: File) => Promise<void>
    onDismissError: () => void
  }
}) {
  const filledCount = lines.filter((l) => l.materialId).length

  return (
    <DocumentLinesSection
      title={'出库清单'}
      tip={'可上传 PDF 或图片自动识别明细并回填；电子版 PDF 直接提取文字，扫描件请改用图片识别'}
      onAddLine={onAddLine}
      addTitle="出库清单"
      footerExtra={<InboundImportActions layout="inline" {...importProps} />}
      trailing={filledCount > 0 ? (
        <span className="text-xs tabular-nums text-muted-foreground">{filledCount} 行</span>
      ) : undefined}
    >
      <MaterialLinesEditor
        variant="table-form"
        lines={lines.map((l) => ({ materialId: l.materialId, quantity: l.requestedQty }))}
        materials={materials}
        onChange={(next) => onChange(next.map((l) => ({ materialId: l.materialId, requestedQty: l.quantity })))}
        onAddLine={onAddLine}
        hideFooterAdd
        quantityLabel="申请数量"
      />
    </DocumentLinesSection>
  )
}
