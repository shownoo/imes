import type { LogAction, LogModule, Prisma } from '@prisma/client'
import type { Context } from '../context.js'
import { buildChangeDetail, type LogChangeDetail } from './log-diff.js'

export type SystemLogInput = {
  action: LogAction
  module: LogModule
  summary: string
  targetId?: string
  targetLabel?: string
  /** 修改前快照（与 after 一起传入时自动生成 changes） */
  before?: Record<string, unknown> | null
  /** 修改后快照 */
  after?: Record<string, unknown> | null
  /** 自定义详情；若未提供且存在 before/after 则自动 diff */
  detail?: Prisma.InputJsonValue | LogChangeDetail
  userId?: string
}

export async function writeSystemLog(ctx: Context, input: SystemLogInput) {
  const userId = input.userId ?? ctx.identity?.userId
  if (!userId) return

  let detail: Prisma.InputJsonValue | undefined
  if (input.detail != null) {
    detail = input.detail as Prisma.InputJsonValue
  } else if (input.before != null || input.after != null) {
    detail = buildChangeDetail(input.before, input.after) as Prisma.InputJsonValue
  }

  try {
    await ctx.prisma.systemLog.create({
      data: {
        userId,
        action: input.action,
        module: input.module,
        summary: input.summary,
        targetId: input.targetId,
        targetLabel: input.targetLabel,
        detail,
        ipAddress: ctx.clientIp,
      },
    })
  } catch {
    // 日志写入失败不应影响主业务
  }
}
