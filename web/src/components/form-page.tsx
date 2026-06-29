import { ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from 'components/common'
import { Label } from 'components/ui/label'
import { LeaderSurfaceCard } from 'components/leader-surface-card'
import { leaderFormLabelStyle } from 'components/leader-page-header'
import { cn } from 'lib/utils'

export function FormField({ label, required, children, className }: {
  label: string
  required?: boolean
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('space-y-2', className)}>
      <Label style={leaderFormLabelStyle}>
        {label}
        {required && <span className="ml-0.5 text-destructive">*</span>}
      </Label>
      {children}
    </div>
  )
}

/** 表单双列/多列网格 — 间距随 --leader-grid-gap */
export function FormGrid({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('leader-form-grid grid grid-cols-2', className)} {...props}>
      {children}
    </div>
  )
}

interface PageShellProps {
  title: string
  backTo: string
  backLabel?: string
  desc?: string
  wide?: boolean
  footer?: React.ReactNode
  children: React.ReactNode
}

export function FormPage({ title, backTo, backLabel, desc, wide, footer, children }: PageShellProps) {
  const navigate = useNavigate()
  return (
    <div className={cn('leader-workspace-grid w-full space-y-5', wide ? 'max-w-[min(100%,88rem)]' : 'max-w-3xl')}>
      <PageToolbar
        title={title}
        desc={desc}
        backLabel={backLabel}
        onBack={() => navigate(backTo)}
      />
      <LeaderSurfaceCard formSurface contentClassName="flex flex-col p-0">
        <div className="flex-1 px-8 py-8">{children}</div>
        {footer && (
          <div className="flex items-center justify-end gap-2 border-t border-border/60 px-8 py-4">
            {footer}
          </div>
        )}
      </LeaderSurfaceCard>
    </div>
  )
}

export function DocumentPage({ title, backTo, backLabel, desc, wide, footer, children }: PageShellProps) {
  const navigate = useNavigate()
  return (
    <div className={cn('leader-workspace-grid space-y-6', wide ? 'max-w-5xl' : 'max-w-4xl')}>
      <PageToolbar
        title={title}
        desc={desc}
        backLabel={backLabel}
        onBack={() => navigate(backTo)}
        footer={footer}
      />
      {children}
    </div>
  )
}

function PageToolbar({ title, desc, backLabel, onBack, footer }: {
  title: string
  desc?: string
  backLabel?: string
  onBack: () => void
  footer?: React.ReactNode
}) {
  return (
    <div className="leader-page-toolbar flex items-center justify-between gap-4">
      <div className="flex min-w-0 items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 shrink-0 gap-1.5 px-2 text-muted-foreground hover:text-foreground"
          onClick={onBack}
        >
          <ArrowLeft className="size-4" />
          {backLabel ?? '返回'}
        </Button>
        <span className="text-muted-foreground/40" aria-hidden>/</span>
        <div className="min-w-0">
          <h1 className="truncate text-base font-semibold tracking-tight text-foreground">{title}</h1>
          {desc && (
            <p className="mt-0.5 truncate text-xs text-muted-foreground">{desc}</p>
          )}
        </div>
      </div>
      {footer && <div className="leader-page-actions flex shrink-0 items-center gap-2">{footer}</div>}
    </div>
  )
}
