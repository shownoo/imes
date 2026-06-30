import type { ReactNode } from 'react'
import { Tooltip, TooltipContent, TooltipTrigger } from 'components/ui/tooltip'
import { cn } from 'lib/utils'

export type ProcessStep = {
  label: string
  tip?: string
}

function StepItem({ step, index, showArrow }: { step: ProcessStep; index: number; showArrow: boolean }) {
  const content = (
    <span className="flex items-center gap-1.5 text-muted-foreground">
      {showArrow && <span className="select-none text-border/80" aria-hidden>›</span>}
      <span
        className={cn(
          'flex size-[18px] shrink-0 items-center justify-center rounded-full text-[10px] font-medium tabular-nums',
          step.tip
            ? 'bg-background text-foreground/70 ring-1 ring-border/60 group-hover:ring-primary/30 group-hover:text-primary'
            : 'bg-muted text-muted-foreground',
        )}
      >
        {index + 1}
      </span>
      <span className={cn('text-xs', step.tip && 'group-hover:text-foreground')}>{step.label}</span>
    </span>
  )

  if (!step.tip) return content

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className="group -mx-0.5 cursor-help rounded-md px-0.5 outline-none transition-colors hover:bg-background/60 focus-visible:ring-2 focus-visible:ring-ring/40"
        >
          {content}
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="max-w-[18rem] leading-relaxed">
        {step.tip}
      </TooltipContent>
    </Tooltip>
  )
}

/** 流程步骤条 — 轻量内联，详情悬停显示 */
export function ProcessStepper({
  steps,
  className,
  trailing,
}: {
  steps: ProcessStep[]
  className?: string
  trailing?: ReactNode
}) {
  return (
    <div
      className={cn(
        'mb-4 flex flex-wrap items-center justify-between gap-x-3 gap-y-2 rounded-lg border border-border/50 bg-muted/25 px-3 py-2',
        className,
      )}
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
        {steps.map((step, i) => (
          <StepItem key={step.label} step={step} index={i} showArrow={i > 0} />
        ))}
      </div>
      {trailing}
    </div>
  )
}
