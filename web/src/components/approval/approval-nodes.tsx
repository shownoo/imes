import { memo } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { CheckCircle2, Circle, PlayCircle, UserCheck, XCircle } from 'lucide-react'
import { cn } from 'lib/utils'
import { ROLE_OPTIONS, type NodeProgressState } from 'lib/approval-flow'

type NodeData = {
  label: string
  role?: string
  mode?: 'any' | 'all'
  outcome?: 'approved' | 'rejected'
  progress?: NodeProgressState
  selected?: boolean
}

function roleLabel(code?: string) {
  return ROLE_OPTIONS.find((r) => r.value === code)?.label ?? code ?? '—'
}

function ProgressRing({ state }: { state?: NodeProgressState }) {
  if (state === 'done') return <CheckCircle2 className="size-4 shrink-0 text-emerald-500" />
  if (state === 'active') return <Circle className="size-4 shrink-0 animate-pulse text-primary" fill="currentColor" />
  return <Circle className="size-4 shrink-0 text-muted-foreground/40" />
}

function shell(type: string, progress?: NodeProgressState, selected?: boolean) {
  const base = 'min-w-[140px] rounded-xl border-2 px-4 py-3 shadow-sm transition-colors'
  if (selected) return cn(base, 'border-primary bg-primary/5')
  if (progress === 'done') return cn(base, 'border-emerald-500/50 bg-emerald-500/5')
  if (progress === 'active') return cn(base, 'border-primary bg-primary/10 ring-2 ring-primary/20')
  if (type === 'start') return cn(base, 'border-blue-400/60 bg-blue-50/80 dark:bg-blue-950/30')
  if (type === 'end') return cn(base, 'border-muted bg-muted/30')
  return cn(base, 'border-amber-400/60 bg-amber-50/80 dark:bg-amber-950/20')
}

export const StartNode = memo(({ data }: NodeProps) => {
  const d = data as NodeData
  return (
    <div className={shell('start', d.progress, d.selected)}>
      <Handle type="source" position={Position.Right} className="!bg-blue-500" />
      <div className="flex items-center gap-2">
        <PlayCircle className="size-4 text-blue-500" />
        <span className="text-sm font-medium">{d.label}</span>
        {d.progress && d.progress !== 'pending' && <ProgressRing state={d.progress} />}
      </div>
    </div>
  )
})

export const ApprovalNode = memo(({ data }: NodeProps) => {
  const d = data as NodeData
  return (
    <div className={shell('approval', d.progress, d.selected)}>
      <Handle type="target" position={Position.Left} className="!bg-amber-500" />
      <Handle type="source" position={Position.Right} className="!bg-amber-500" />
      <div className="flex items-center gap-2">
        <UserCheck className="size-4 text-amber-600" />
        <span className="text-sm font-medium">{d.label}</span>
        {d.progress && d.progress !== 'pending' && <ProgressRing state={d.progress} />}
      </div>
      <p className="mt-1 text-[11px] text-muted-foreground">{roleLabel(d.role)} · {d.mode === 'all' ? '会签' : '或签'}</p>
    </div>
  )
})

export const EndNode = memo(({ data }: NodeProps) => {
  const d = data as NodeData
  const rejected = d.outcome === 'rejected'
  return (
    <div className={shell('end', d.progress, d.selected)}>
      <Handle type="target" position={Position.Left} className={rejected ? '!bg-red-500' : '!bg-emerald-500'} />
      <div className="flex items-center gap-2">
        {rejected ? <XCircle className="size-4 text-red-500" /> : <CheckCircle2 className="size-4 text-emerald-500" />}
        <span className="text-sm font-medium">{d.label}</span>
        {d.progress && d.progress !== 'pending' && <ProgressRing state={d.progress} />}
      </div>
    </div>
  )
})

export const approvalNodeTypes = {
  start: StartNode,
  approval: ApprovalNode,
  end: EndNode,
}
