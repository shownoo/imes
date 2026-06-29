import { FlowCanvas } from './flow-canvas'
import type { FlowGraph, NodeProgressState } from 'lib/approval-flow'

type Props = {
  graph: FlowGraph
  progress?: Array<{ id: string; state: NodeProgressState }>
  title?: string
}

export function ApprovalFlowViewer({ graph, progress, title = '审批进度' }: Props) {
  return (
    <div>
      <h3 className="mb-3 text-sm font-medium text-muted-foreground">{title}</h3>
      <FlowCanvas graph={graph} progress={progress} readonly height={280} />
      {progress && progress.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><span className="inline-block size-2 rounded-full bg-emerald-500" />已完成</span>
          <span className="flex items-center gap-1"><span className="inline-block size-2 rounded-full bg-primary animate-pulse" />进行中</span>
          <span className="flex items-center gap-1"><span className="inline-block size-2 rounded-full bg-muted-foreground/30" />待处理</span>
        </div>
      )}
    </div>
  )
}
