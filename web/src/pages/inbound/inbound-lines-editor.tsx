import { MaterialLinesEditor } from 'components/material-lines-editor'
import { DocumentLinesSection } from 'components/form-page'
import { InboundImportActions, type ImportResult } from './inbound-import-panel'
import type { InboundLineRow } from './queries'
import type { MaterialOption } from 'components/material-lines-editor'

export type { MaterialOption } from 'components/material-lines-editor'

export function InboundLinesEditor({
  lines,
  materials,
  onChange,
  onAddLine,
  importProps,
}: {
  lines: InboundLineRow[]
  materials: MaterialOption[]
  onChange: (lines: InboundLineRow[]) => void
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
      title="入库清单"
      tip="可上传 PDF 或图片自动识别明细并回填；电子版 PDF 直接提取文字，扫描件请改用图片识别"
      onAddLine={onAddLine}
      addTitle="入库清单"
      footerExtra={<InboundImportActions layout="inline" {...importProps} />}
      trailing={filledCount > 0 ? (
        <span className="text-xs tabular-nums text-muted-foreground">{filledCount} 行</span>
      ) : undefined}
    >
      <MaterialLinesEditor
        variant="table-form"
        manufacturerEditable
        lines={lines.map((l) => ({
          materialId: l.materialId,
          quantity: l.expectedQty,
          manufacturer: l.manufacturer ?? '',
        }))}
        materials={materials}
        onChange={(next) => onChange(next.map((l) => ({
          materialId: l.materialId,
          expectedQty: l.quantity,
          manufacturer: l.manufacturer ?? '',
        })))}
        onAddLine={onAddLine}
        hideFooterAdd
        quantityLabel="预期数量"
      />
    </DocumentLinesSection>
  )
}
