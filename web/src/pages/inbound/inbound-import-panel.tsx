import { useCallback, useRef, useState } from 'react'
import { FileImage, FileText, Loader2 } from 'lucide-react'
import { Button, ToolbarButton } from 'components/common'
import { cn } from 'lib/utils'

export type ImportResult = {
  matched: number
  unmatched: number
}

type InboundImportActionsProps = {
  isParsing: boolean
  parsingKind: 'pdf' | 'image' | null
  parseError: string | null
  result: ImportResult | null
  onImportPdf: (file: File) => Promise<void>
  onImportImage: (file: File) => Promise<void>
  onDismissError: () => void
}

function pickFile(accept: string, handler: (file: File) => Promise<void>) {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = accept
  input.onchange = async (e) => {
    const file = (e.target as HTMLInputElement).files?.[0]
    if (file) await handler(file)
  }
  input.click()
}

export function InboundImportActions({
  isParsing,
  parsingKind,
  parseError,
  result,
  onImportPdf,
  onImportImage,
  onDismissError,
}: InboundImportActionsProps) {
  const [dragOver, setDragOver] = useState(false)
  const dragDepth = useRef(0)

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault()
      dragDepth.current = 0
      setDragOver(false)
      if (isParsing) return
      const file = e.dataTransfer.files[0]
      if (!file) return
      if (/\.pdf$/i.test(file.name)) await onImportPdf(file)
      else if (/\.(png|jpe?g|webp)$/i.test(file.name)) await onImportImage(file)
    },
    [isParsing, onImportPdf, onImportImage],
  )

  const parsingLabel =
    parsingKind === 'pdf' ? '解析 PDF…' : parsingKind === 'image' ? '识别图片…' : '处理中…'

  const statusText = parseError
    ? parseError
    : isParsing
      ? parsingLabel
      : result
        ? result.unmatched > 0
          ? `已识别 ${result.matched} 行，${result.unmatched} 行需手动选物资`
          : `已识别 ${result.matched} 行`
        : null

  return (
    <div
      onDragEnter={(e) => {
        e.preventDefault()
        dragDepth.current += 1
        setDragOver(true)
      }}
      onDragLeave={(e) => {
        e.preventDefault()
        dragDepth.current -= 1
        if (dragDepth.current <= 0) {
          dragDepth.current = 0
          setDragOver(false)
        }
      }}
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
      className={cn(
        'flex flex-wrap items-center gap-3 rounded-lg transition-colors',
        dragOver && 'bg-primary/[0.04] ring-1 ring-primary/20 ring-inset',
      )}
    >
      <div className="flex items-center gap-0.5">
        <ToolbarButton disabled={isParsing} onClick={() => pickFile('.pdf,application/pdf', onImportPdf)}>
          <FileText className="size-3.5" />
          PDF
        </ToolbarButton>
        <ToolbarButton disabled={isParsing} onClick={() => pickFile('.png,.jpg,.jpeg,.webp,image/*', onImportImage)}>
          <FileImage className="size-3.5" />
          图片
        </ToolbarButton>
      </div>

      {statusText && (
        <p
          className={cn(
            'flex min-w-0 flex-1 items-center gap-1.5 text-xs',
            parseError ? 'text-destructive' : 'text-muted-foreground',
          )}
        >
          {isParsing && <Loader2 className="size-3 shrink-0 animate-spin" />}
          <span className="truncate">{statusText}</span>
          {parseError && (
            <button type="button" className="shrink-0 underline-offset-2 hover:underline" onClick={onDismissError}>关闭</button>
          )}
        </p>
      )}
    </div>
  )
}
