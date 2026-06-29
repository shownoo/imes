import { useEffect, useRef, useState } from 'react'
import { BrowserMultiFormatReader, type IScannerControls } from '@zxing/browser'
import { Camera, CameraOff } from 'lucide-react'
import { Button } from 'components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from 'components/ui/dialog'

type QrScannerDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onScan: (text: string) => void
  title?: string
}

export function QrScannerDialog({
  open,
  onOpenChange,
  onScan,
  title = '扫描二维码',
}: QrScannerDialogProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const controlsRef = useRef<IScannerControls | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [starting, setStarting] = useState(false)

  const stopScanner = () => {
    controlsRef.current?.stop()
    controlsRef.current = null
  }

  useEffect(() => {
    if (!open) {
      stopScanner()
      setError(null)
      return
    }

    let cancelled = false
    const reader = new BrowserMultiFormatReader()
    setStarting(true)
    setError(null)

    void (async () => {
      try {
        const devices = await BrowserMultiFormatReader.listVideoInputDevices()
        const deviceId = devices.find((d) => /back|rear|environment/i.test(d.label))?.deviceId
          ?? devices[0]?.deviceId

        if (!deviceId || !videoRef.current) {
          if (!cancelled) setError('未检测到可用摄像头')
          return
        }

        const controls = await reader.decodeFromVideoDevice(deviceId, videoRef.current, (result) => {
          if (!result || cancelled) return
          const text = result.getText().trim()
          if (!text) return
          stopScanner()
          onScan(text)
          onOpenChange(false)
        })
        if (!cancelled) controlsRef.current = controls
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : '无法启动摄像头，请检查浏览器权限')
        }
      } finally {
        if (!cancelled) setStarting(false)
      }
    })()

    return () => {
      cancelled = true
      stopScanner()
    }
  }, [open, onOpenChange, onScan])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm gap-4 p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>将二维码置于取景框中央，识别成功后自动填入</DialogDescription>
        </DialogHeader>

        <div className="relative mx-6 aspect-square overflow-hidden rounded-lg bg-black">
          <video ref={videoRef} className="size-full object-cover" muted playsInline />
          <div className="pointer-events-none absolute inset-6 rounded-lg border-2 border-white/70" />
          {starting && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-sm text-white">正在启动摄像头…</div>
          )}
        </div>

        {error && (
          <div className="mx-6 flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            <CameraOff className="mt-0.5 size-4 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <div className="flex justify-end gap-2 border-t px-6 py-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>取消</Button>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            <Camera className="size-4" />手动输入</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
