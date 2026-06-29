import type { FlowGraph } from './approval-types.js'

const TIMING = {
  timeoutHours: 48,
  remindIntervalHours: 4,
  maxRemindCount: 5,
  onTimeout: 'remind' as const,
}

/** 多级审批：主管 → 管理员复核 */
export const DEFAULT_OUTBOUND_FLOW: FlowGraph = {
  nodes: [
    { id: 'start', type: 'start', position: { x: 40, y: 200 }, data: { label: '提交审核' } },
    {
      id: 'supervisor',
      type: 'approval',
      position: { x: 220, y: 200 },
      data: { label: '主管审批', role: 'SUPERVISOR', mode: 'any', ...TIMING },
    },
    {
      id: 'admin',
      type: 'approval',
      position: { x: 420, y: 200 },
      data: { label: '管理员复核', role: 'ADMIN', mode: 'any', ...TIMING },
    },
    { id: 'end_ok', type: 'end', position: { x: 620, y: 120 }, data: { label: '审核通过', outcome: 'approved' } },
    { id: 'end_no', type: 'end', position: { x: 620, y: 280 }, data: { label: '已驳回', outcome: 'rejected' } },
  ],
  edges: [
    { id: 'e-start-supervisor', source: 'start', target: 'supervisor' },
    { id: 'e-supervisor-admin', source: 'supervisor', target: 'admin', data: { label: '通过', action: 'approved' } },
    { id: 'e-supervisor-no', source: 'supervisor', target: 'end_no', data: { label: '驳回', action: 'rejected' } },
    { id: 'e-admin-ok', source: 'admin', target: 'end_ok', data: { label: '通过', action: 'approved' } },
    { id: 'e-admin-no', source: 'admin', target: 'end_no', data: { label: '驳回', action: 'rejected' } },
  ],
}

export const DEFAULT_INBOUND_FLOW: FlowGraph = {
  nodes: [
    { id: 'start', type: 'start', position: { x: 40, y: 200 }, data: { label: '提交审核' } },
    {
      id: 'supervisor',
      type: 'approval',
      position: { x: 220, y: 200 },
      data: { label: '主管审批', role: 'SUPERVISOR', mode: 'any', ...TIMING },
    },
    {
      id: 'admin',
      type: 'approval',
      position: { x: 420, y: 200 },
      data: { label: '管理员复核', role: 'ADMIN', mode: 'any', ...TIMING },
    },
    { id: 'end_ok', type: 'end', position: { x: 620, y: 120 }, data: { label: '审核通过', outcome: 'approved' } },
    { id: 'end_no', type: 'end', position: { x: 620, y: 280 }, data: { label: '已驳回', outcome: 'rejected' } },
  ],
  edges: [
    { id: 'start-supervisor', source: 'start', target: 'supervisor' },
    { id: 'supervisor-admin', source: 'supervisor', target: 'admin', data: { label: '通过', action: 'approved' } },
    { id: 'supervisor-no', source: 'supervisor', target: 'end_no', data: { label: '驳回', action: 'rejected' } },
    { id: 'admin-ok', source: 'admin', target: 'end_ok', data: { label: '通过', action: 'approved' } },
    { id: 'admin-no', source: 'admin', target: 'end_no', data: { label: '驳回', action: 'rejected' } },
  ],
}
