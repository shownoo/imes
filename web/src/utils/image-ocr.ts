import type { Worker } from 'tesseract.js'

let workerPromise: Promise<Worker> | null = null

async function getOcrWorker(): Promise<Worker> {
  if (!workerPromise) {
    workerPromise = (async () => {
      const { createWorker } = await import('tesseract.js')
      const worker = await createWorker('chi_sim+eng', 1, {
        logger: () => {},
      })
      return worker
    })()
  }
  return workerPromise
}

/** OCR image file to plain text (Chinese + English). */
export async function imageFileToPlainText(file: File): Promise<string> {
  const worker = await getOcrWorker()
  const {
    data: { text },
  } = await worker.recognize(file)
  return text.trim()
}
