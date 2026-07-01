import { Users } from 'lucide-react'
import { cn } from 'lib/utils'

export function CollabNotice({ message, className }: { message: string | null; className?: string }) {
  if (!message) return null
  return (
    <div
      className={cn(
        'flex items-center gap-2 rounded-xl border border-primary/25 bg-primary/8 px-3 py-2 text-xs text-foreground',
        className,
      )}
      role="status"
    >
      <Users className="size-3.5 shrink-0 text-primary" aria-hidden />
      <span>{message}</span>
    </div>
  )
}
