import { useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Printer } from 'lucide-react'
import { QrLabel, type QrLabelData } from 'components/qr-label'
import { Button } from 'components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from 'components/ui/dialog'
import { printLabelFromElement } from 'lib/print-label'

type QrLabelDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  label: QrLabelData | null
  description?: string
}

export function QrLabelDialog({ open, onOpenChange, label, description }: QrLabelDialogProps) {
  const { t } = useTranslation()
  const printRef = useRef<HTMLDivElement>(null)

  if (!label) return null

  const handlePrint = () => {
    if (!printRef.current) return
    printLabelFromElement(printRef.current, `标签 ${label.qrCode}`)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{'打印标签'}</DialogTitle>
          <DialogDescription>{description ?? '确认信息后打印并贴于物资或货位'}</DialogDescription>
        </DialogHeader>

        <div className="flex justify-center py-2">
          <QrLabel {...label} size={140} />
        </div>
        <div ref={printRef} className="sr-only" aria-hidden>
          <QrLabel {...label} size={140} printMode />
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>关闭</Button>
          <Button onClick={handlePrint}>
            <Printer className="size-4" />{'打印'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/** 列表行「打码」按钮 */
export function QrPrintButton({
  label,
  onOpen,
}: {
  label: QrLabelData
  onOpen: (label: QrLabelData) => void
}) {
  return (
    <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => onOpen(label)}>
      <Printer className="size-3" />{'打码'}</Button>
  )
}
