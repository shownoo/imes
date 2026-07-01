import { builder } from '../builder.js'
import {
  completeApprovalTask,
  getApprovalInstance,
  buildInstanceProgress,
  countMyPendingTasks,
} from '../lib/approval.js'
import { fetchMyPendingApprovals } from '../lib/workbench.js'
import { IdInput } from './input-types.js'

const SaveApprovalFlowInput = builder.inputType('SaveApprovalFlowInput', {
  fields: (t) => ({
    bizType: t.string({ required: true }),
    name: t.string({ required: true }),
    description: t.string({ required: false }),
    graph: t.field({ type: 'JSON', required: true }),
    active: t.boolean({ required: false }),
  }),
})

const CompleteApprovalTaskInput = builder.inputType('CompleteApprovalTaskInput', {
  fields: (t) => ({
    taskId: t.id({ required: true }),
    action: t.string({ required: true }),
    comment: t.string({ required: false }),
  }),
})

builder.queryField('getApprovalFlows', (t) =>
  t.field({
    type: 'JSON',
    authScopes: { admin: true },
    resolve: async (_, __, ctx) =>
      ctx.prisma.approvalFlow.findMany({ orderBy: { bizType: 'asc' } }),
  }),
)

builder.queryField('getApprovalFlow', (t) =>
  t.field({
    type: 'JSON',
    authScopes: { authenticated: true },
    args: { bizType: t.arg.string({ required: true }) },
    resolve: async (_, { bizType }, ctx) =>
      ctx.prisma.approvalFlow.findUnique({ where: { bizType } }),
  }),
)

builder.queryField('getApprovalInstance', (t) =>
  t.field({
    type: 'JSON',
    authScopes: { authenticated: true },
    args: {
      bizType: t.arg.string({ required: true }),
      bizId: t.arg.string({ required: true }),
    },
    resolve: async (_, { bizType, bizId }, ctx) => {
      const instance = await getApprovalInstance(ctx.prisma, bizType, bizId)
      if (!instance) return null
      return {
        ...instance,
        progress: buildInstanceProgress(instance),
      }
    },
  }),
)

builder.mutationField('saveApprovalFlow', (t) =>
  t.field({
    type: 'JSON',
    authScopes: { admin: true },
    args: { input: t.arg({ type: SaveApprovalFlowInput, required: true }) },
    resolve: async (_, { input }, ctx) => {
      const { bizType, name, description, graph, active } = input
      return ctx.prisma.approvalFlow.upsert({
        where: { bizType },
        create: {
          bizType,
          name,
          description,
          graph: graph as never,
          active: active ?? true,
        },
        update: {
          name,
          description,
          graph: graph as never,
          active: active ?? true,
        },
      })
    },
  }),
)

builder.mutationField('completeApprovalTask', (t) =>
  t.field({
    type: 'JSON',
    authScopes: { authenticated: true },
    args: { input: t.arg({ type: CompleteApprovalTaskInput, required: true }) },
    resolve: async (_, { input }, ctx) => {
      const action = input.action === 'rejected' ? 'rejected' : 'approved'
      const instance = await completeApprovalTask(
        ctx.prisma,
        input.taskId,
        action,
        ctx.identity!.userId,
        ctx.identity!.role,
        input.comment ?? undefined,
      )
      return {
        ...instance,
        progress: buildInstanceProgress(instance),
      }
    },
  }),
)

builder.queryField('getMyPendingApprovalTasks', (t) =>
  t.field({
    type: 'JSON',
    authScopes: { authenticated: true },
    resolve: async (_, __, ctx) =>
      fetchMyPendingApprovals(ctx.prisma, ctx.identity!.role, 50),
  }),
)

builder.queryField('getApprovalInboxCount', (t) =>
  t.field({
    type: 'JSON',
    authScopes: { authenticated: true },
    resolve: async (_, __, ctx) => {
      const count = await countMyPendingTasks(ctx.prisma, ctx.identity!.role)
      return { count }
    },
  }),
)

builder.queryField('getApprovalFlowById', (t) =>
  t.field({
    type: 'JSON',
    authScopes: { admin: true },
    args: { input: t.arg({ type: IdInput, required: true }) },
    resolve: async (_, { input }, ctx) =>
      ctx.prisma.approvalFlow.findUnique({ where: { id: input.id } }),
  }),
)
