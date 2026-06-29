type PdfJsModule = typeof import('pdfjs-dist')

let pdfjsPromise: Promise<PdfJsModule> | null = null
let workerConfigured = false

async function getPdfJs(): Promise<PdfJsModule> {
  if (!pdfjsPromise) {
    pdfjsPromise = import('pdfjs-dist')
  }
  return pdfjsPromise
}

async function ensurePdfWorker(): Promise<PdfJsModule> {
  const pdfjs = await getPdfJs()
  if (!workerConfigured) {
    const { default: pdfWorkerSrc } = await import(
      'pdfjs-dist/build/pdf.worker.min.mjs?url'
    )
    pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerSrc
    workerConfigured = true
  }
  return pdfjs
}

const LINE_Y_TOL = 4
const GAP_FOR_SPACE = 6

type TextPiece = { str: string; x: number; y: number }

/** Extract plain text from all PDF pages (no OCR). */
export async function pdfFileToPlainText(file: File): Promise<{
  text: string
  warnings: string[]
}> {
  const pdfjs = await ensurePdfWorker()
  const data = await file.arrayBuffer()
  const pdf = await pdfjs.getDocument({ data }).promise
  const warnings: string[] = []
  if (pdf.numPages === 0) {
    return { text: '', warnings }
  }

  const pageTexts: string[] = []

  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p)
    const tc = await page.getTextContent()
    const pieces: TextPiece[] = []

    for (const item of tc.items) {
      if (!('str' in item) || !item.str) continue
      const tm = item.transform
      pieces.push({ str: item.str, x: tm[4], y: tm[5] })
    }

    if (pieces.length === 0) {
      warnings.push('pdf_page_no_text')
      continue
    }

    pieces.sort((a, b) => b.y - a.y || a.x - b.x)

    const lines: TextPiece[][] = []
    let cur: TextPiece[] = []
    let curY: number | null = null
    for (const piece of pieces) {
      if (curY === null) {
        curY = piece.y
        cur = [piece]
        continue
      }
      if (Math.abs(piece.y - curY) < LINE_Y_TOL) {
        cur.push(piece)
      } else {
        lines.push(cur)
        cur = [piece]
        curY = piece.y
      }
    }
    if (cur.length) lines.push(cur)

    const lineStrs = lines
      .map((lineParts) => {
        lineParts.sort((a, b) => a.x - b.x)
        let out = ''
        let lastEndX = -Infinity
        for (const part of lineParts) {
          const gap = part.x - lastEndX
          if (out && gap > GAP_FOR_SPACE) out += ' '
          out += part.str
          lastEndX = part.x + Math.max(2, part.str.length * 4)
        }
        return out.trim()
      })
      .filter((s) => s.length > 0)

    if (lineStrs.length) pageTexts.push(lineStrs.join('\n'))
  }

  return { text: pageTexts.join('\n\n'), warnings }
}
