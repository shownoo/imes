import { useCallback, useState } from 'react'
import { useMutation } from '@apollo/client'
import { PARSE_INBOUND_TEXT } from './queries'

export type DocumentImportKind = 'pdf' | 'image'

export type ParsedInboundRow = {
  materialId: string
  expectedQty: number
  hint?: string
  matchedBy?: string
}

export type InboundParseResult = {
  rows: ParsedInboundRow[]
  unmatched: Array<{ hint: string; expectedQty: number }>
}

interface UseInboundDocumentImportOptions {
  onParsed: (result: InboundParseResult) => void
}

interface UseInboundDocumentImportReturn {
  isParsing: boolean
  parsingKind: DocumentImportKind | null
  parseError: string | null
  importPdf: (file: File) => Promise<void>
  importImage: (file: File) => Promise<void>
  clearError: () => void
}

export function useInboundDocumentImport(
  options: UseInboundDocumentImportOptions,
): UseInboundDocumentImportReturn {
  const [isParsing, setIsParsing] = useState(false)
  const [parsingKind, setParsingKind] = useState<DocumentImportKind | null>(null)
  const [parseError, setParseError] = useState<string | null>(null)
  const [parseText] = useMutation(PARSE_INBOUND_TEXT)

  const runParse = useCallback(
    async (text: string, kind: DocumentImportKind) => {
      const trimmed = text.trim()
      if (!trimmed) {
        throw new Error(kind === 'pdf' ? 'PDF 中未提取到文本，扫描件请改用图片识别' : '图片中未识别到文字')
      }

      const { data } = await parseText({ variables: { text: trimmed } })
      const raw = data?.parseInboundDocumentText as InboundParseResult | undefined
      const rows = raw?.rows ?? []
      if (rows.length === 0) {
        const unmatched = raw?.unmatched?.length ?? 0
        throw new Error(
          unmatched > 0
            ? `识别到 ${unmatched} 行但未能匹配物资，请检查档案或手动选择`
            : '未能从文档中解析出有效明细',
        )
      }

      options.onParsed({
        rows,
        unmatched: raw?.unmatched ?? [],
      })
    },
    [parseText, options],
  )

  const importPdf = useCallback(
    async (file: File) => {
      setIsParsing(true)
      setParsingKind('pdf')
      setParseError(null)
      try {
        if (!file.name.match(/\.pdf$/i)) {
          throw new Error('请选择 PDF 文件')
        }
        await new Promise<void>((r) => setTimeout(r, 50))
        const { pdfFileToPlainText } = await import('utils/template-import-pdf')
        const { text } = await pdfFileToPlainText(file)
        await runParse(text, 'pdf')
      } catch (err) {
        setParseError(err instanceof Error ? err.message : String(err))
      } finally {
        setIsParsing(false)
        setParsingKind(null)
      }
    },
    [runParse],
  )

  const importImage = useCallback(
    async (file: File) => {
      setIsParsing(true)
      setParsingKind('image')
      setParseError(null)
      try {
        if (!file.name.match(/\.(png|jpe?g|webp)$/i)) {
          throw new Error('请选择 .png / .jpg / .webp 图片')
        }
        await new Promise<void>((r) => setTimeout(r, 50))
        const { imageFileToPlainText } = await import('utils/image-ocr')
        const text = await imageFileToPlainText(file)
        await runParse(text, 'image')
      } catch (err) {
        setParseError(err instanceof Error ? err.message : String(err))
      } finally {
        setIsParsing(false)
        setParsingKind(null)
      }
    },
    [runParse],
  )

  const clearError = useCallback(() => setParseError(null), [])

  return {
    isParsing,
    parsingKind,
    parseError,
    importPdf,
    importImage,
    clearError,
  }
}
