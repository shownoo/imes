export type FlowNodeType = 'start' | 'approval' | 'end'

export type FlowNodeData = {
  label: string
  role?: string
  mode?: 'any' | 'all'
  outcome?: 'approved' | 'rejected'
  timeoutHours?: number
  onTimeout?: 'remind' | 'approve' | 'reject'
  remindIntervalHours?: number
  maxRemindCount?: number
}

export type FlowNode = {
  id: string
  type: FlowNodeType
  position: { x: number; y: number }
  data: FlowNodeData
}

export type FlowEdge = {
  id: string
  source: string
  target: string
  data?: { label?: string; action?: 'approved' | 'rejected' }
}

export type FlowGraph = {
  nodes: FlowNode[]
  edges: FlowEdge[]
}

export type NodeProgressState = 'done' | 'active' | 'pending'

export const ROLE_OPTIONS = [
  { value: 'SUPERVISOR', label: '仓储主管' },
  { value: 'ADMIN', label: '系统管理员' },
  { value: 'WAREHOUSE_KEEPER', label: '仓管员' },
]

export function canActOnAssignee(userRole: string, assigneeRole?: string | null) {
  if (!assigneeRole) return true
  if (userRole === 'ADMIN') return true
  return userRole === assigneeRole
}

export type ApprovalInboxItem = {
  taskId: string
  nodeLabel?: string | null
  bizType: string
  bizId: string
  bizLabel: string
  docPath: string
  orderNo: string
  summary: string
  submitter: string
  createdAt: string
  dueAt?: string | null
  remindCount?: number
}

const NODE_TIMING = {
  timeoutHours: 48,
  remindIntervalHours: 4,
  maxRemindCount: 5,
  onTimeout: 'remind' as const,
}

export function emptyGraph(): FlowGraph {
  return {
    nodes: [
      { id: 'start', type: 'start', position: { x: 40, y: 200 }, data: { label: '开始' } },
      {
        id: 'supervisor',
        type: 'approval',
        position: { x: 220, y: 200 },
      data: { label: '主管审批', role: 'SUPERVISOR', mode: 'any', ...NODE_TIMING },
    },
    {
      id: 'admin',
      type: 'approval',
      position: { x: 420, y: 200 },
      data: { label: '管理员复核', role: 'ADMIN', mode: 'any', ...NODE_TIMING },
      },
      { id: 'end_ok', type: 'end', position: { x: 620, y: 120 }, data: { label: '通过', outcome: 'approved' } },
      { id: 'end_no', type: 'end', position: { x: 620, y: 280 }, data: { label: '驳回', outcome: 'rejected' } },
    ],
    edges: [
      { id: 'e1', source: 'start', target: 'supervisor' },
      { id: 'e2', source: 'supervisor', target: 'admin', data: { label: '通过', action: 'approved' } },
      { id: 'e3', source: 'supervisor', target: 'end_no', data: { label: '驳回', action: 'rejected' } },
      { id: 'e4', source: 'admin', target: 'end_ok', data: { label: '通过', action: 'approved' } },
      { id: 'e5', source: 'admin', target: 'end_no', data: { label: '驳回', action: 'rejected' } },
    ],
  }
}

export function inferEdgeData(_sourceId: string, targetId: string, nodes: FlowNode[]): FlowEdge['data'] {
  const target = nodes.find((n) => n.id === targetId)
  if (target?.type === 'end') {
    if (target.data.outcome === 'rejected') return { label: '驳回', action: 'rejected' }
    return { label: '通过', action: 'approved' }
  }
  if (target?.type === 'approval') return { label: '通过', action: 'approved' }
  return { label: '通过', action: 'approved' }
}

export function normalizeGraphEdges(graph: FlowGraph): FlowGraph {
  return {
    ...graph,
    edges: graph.edges.map((e) => {
      const inferred = inferEdgeData(e.source, e.target, graph.nodes)
      return {
        ...e,
        data: {
          label: e.data?.label ?? inferred?.label,
          action: e.data?.action ?? inferred?.action,
        },
      }
    }),
  }
}

export function graphToFlow(graph: FlowGraph, progress?: Array<{ id: string; state: NodeProgressState }>) {
  const progressMap = progress ? new Map(progress.map((p) => [p.id, p.state])) : null
  return {
    nodes: graph.nodes.map((n) => ({
      id: n.id,
      type: n.type,
      position: n.position,
      data: {
        ...n.data,
        progress: progressMap ? (progressMap.get(n.id) ?? 'pending') : undefined,
      },
    })),
    edges: graph.edges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      label: e.data?.label,
      data: e.data,
      animated: progressMap ? progressMap.get(e.target) === 'active' : false,
    })),
  }
}

export function flowToGraph(
  nodes: Array<{ id: string; type?: string; position: { x: number; y: number }; data: FlowNodeData }>,
  edges: Array<{ id: string; source: string; target: string; label?: string; data?: FlowEdge['data'] }>,
): FlowGraph {
  const flowNodes = nodes.map((n) => ({
    id: n.id,
    type: (n.type ?? 'approval') as FlowNodeType,
    position: n.position,
    data: {
      label: n.data.label,
      role: n.data.role,
      mode: n.data.mode,
      outcome: n.data.outcome,
      timeoutHours: n.data.timeoutHours,
      onTimeout: n.data.onTimeout,
      remindIntervalHours: n.data.remindIntervalHours,
      maxRemindCount: n.data.maxRemindCount,
    },
  }))
  return normalizeGraphEdges({
    nodes: flowNodes,
    edges: edges.map((e) => {
      const label = e.data?.label ?? (typeof e.label === 'string' ? e.label : undefined)
      const action =
        e.data?.action ??
        (label === '驳回' ? 'rejected' : label === '通过' ? 'approved' : undefined)
      return {
        id: e.id,
        source: e.source,
        target: e.target,
        data: label || action ? { label, action } : undefined,
      }
    }),
  })
}
