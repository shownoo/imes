import { MaterialLinesEditor } from 'components/material-lines-editor'
import { InboundImportActions, type ImportResult } from './inbound-import-panel'
import type { InboundLineRow } from './queries'
import type { MaterialOption } from 'components/material-lines-editor'

export type { MaterialOption } from 'components/material-lines-editor'

export function InboundLinesEditor({
  lines,
  materials,
  onChange,
  onAddLine,
  hideTitle,
  importProps,
}: {
  lines: InboundLineRow[]
  materials: MaterialOption[]
  onChange: (lines: InboundLineRow[]) => void
  onAddLine: () => void
  hideTitle?: boolean
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
    <div className="space-y-3">
      {!hideTitle && (
        <h3 className="text-sm font-medium text-foreground">
          入库明细
          {filledCount > 0 && (
            <span className="ml-2 text-xs font-normal tabular-nums text-muted-foreground">{filledCount} 行</span>
          )}
        </h3>
      )}

      <MaterialLinesEditor
        lines={lines.map((l) => ({ materialId: l.materialId, quantity: l.expectedQty }))}
        materials={materials}
        onChange={(next) => onChange(next.map((l) => ({ materialId: l.materialId, expectedQty: l.quantity })))}
        onAddLine={onAddLine}
        footer={<InboundImportActions {...importProps} />}
      />
    </div>
  )
}
