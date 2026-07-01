import { AlertTriangle, Info } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from 'components/ui/alert-dialog'
import { cn } from 'lib/utils'

type MessageAlertProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: React.ReactNode
  confirmLabel?: string
  tone?: 'warning' | 'info'
}

export function MessageAlert({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = '知道了',
  tone = 'warning',
}: MessageAlertProps) {
  const Icon = tone === 'warning' ? AlertTriangle : Info

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md gap-4">
        <AlertDialogHeader className="gap-3 sm:text-left">
          <div className="flex items-start gap-3">
            <span
              className={cn(
                'flex size-9 shrink-0 items-center justify-center rounded-full',
                tone === 'warning' ? 'bg-amber-500/12 text-amber-600' : 'bg-sky-500/12 text-sky-600',
              )}
            >
              <Icon className="size-4" aria-hidden />
            </span>
            <div className="min-w-0 space-y-1.5">
              <AlertDialogTitle className="text-base">{title}</AlertDialogTitle>
              {description && (
                <AlertDialogDescription asChild>
                  <div className="text-[13px] leading-relaxed text-muted-foreground">{description}</div>
                </AlertDialogDescription>
              )}
            </div>
          </div>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction className="min-w-20">{confirmLabel}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
