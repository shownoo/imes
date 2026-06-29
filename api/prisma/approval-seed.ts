import { prisma } from '../src/lib/prisma.js'
import { DEFAULT_INBOUND_FLOW, DEFAULT_OUTBOUND_FLOW } from '../src/lib/approval-flow-defaults.js'

export async function seedApprovalFlows() {
  await prisma.approvalFlow.upsert({
    where: { bizType: 'outbound' },
    create: {
      bizType: 'outbound',
      name: '出库审批',
      description: '出库单：主管审批 → 管理员复核',
      graph: DEFAULT_OUTBOUND_FLOW as never,
      active: true,
    },
    update: {
      name: '出库审批',
      description: '出库单：主管审批 → 管理员复核',
      graph: DEFAULT_OUTBOUND_FLOW as never,
    },
  })

  await prisma.approvalFlow.upsert({
    where: { bizType: 'inbound' },
    create: {
      bizType: 'inbound',
      name: '入库审批',
      description: '入库单：主管审批 → 管理员复核',
      graph: DEFAULT_INBOUND_FLOW as never,
      active: true,
    },
    update: {
      name: '入库审批',
      description: '入库单：主管审批 → 管理员复核',
      graph: DEFAULT_INBOUND_FLOW as never,
    },
  })
}
