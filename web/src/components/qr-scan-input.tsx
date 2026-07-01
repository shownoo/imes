import { useState } from 'react'
import { ScanLine } from 'lucide-react'
import { Button } from 'components/ui/button'
import { Input } from 'components/ui/input'
import { QrScannerDialog } from 'components/qr-scanner-dialog'
import { cn } from 'lib/utils'
import { useTranslation } from 'react-i18next'

type QrScanInputProps = {
  value: string
  onChange: (value: string) => void
  onSubmit?: (value: string) => void
  submitLabel?: string
  placeholder?: string
  className?: string
  disabled?: boolean
}

export function QrScanInput({
  value,
  onChange,
  onSubmit,
  submitLabel = '核对',
  placeholder = '扫描或输入二维码',
  className,
  disabled,
}: QrScanInputProps) {
  const { t } = useTranslation()
  const [scannerOpen, setScannerOpen] = useState(false)

  const handleScan = (text: string) => {
    onChange(text)
    onSubmit?.(text)
  }

  return (
    <>
      <div className={cn('flex gap-2', className)}>
        <div className="relative min-w-0 flex-1">
          <ScanLine className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-10 font-mono text-sm"
            value={value}
            disabled={disabled}
            placeholder={placeholder}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && value.trim()) onSubmit?.(value.trim())
            }}
          />
        </div>
        <Button
          type="button"
          variant="outline"
          className="shrink-0"
          disabled={disabled}
          onClick={() => setScannerOpen(true)}
        >
          <ScanLine className="size-4" />{t('扫码')}</Button>
        {onSubmit && (
          <Button
            type="button"
            className="shrink-0"
            disabled={disabled || !value.trim()}
            onClick={() => value.trim() && onSubmit(value.trim())}
          >
            {submitLabel}
          </Button>
        )}
      </div>

      <QrScannerDialog
        open={scannerOpen}
        onOpenChange={setScannerOpen}
        onScan={handleScan}
      />
    </>
  )
}
