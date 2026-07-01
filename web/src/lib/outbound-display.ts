/** 出库单展示层 — 主状态 (DB) + 作业进度 (计算) 双层模型，不新增库表状态 */

export type OutboundLineLike = {
  requestedQty: number
  pickedQty?: number | null
}

/** 全部明细已拣齐，可确认出库（与 shipOutboundOrder 校验一致） */
export function isOutboundReadyToShip(lines: OutboundLineLike[]): boolean {
  if (lines.length === 0) return false
  return lines.every((line) => Number(line.pickedQty ?? 0) >= Number(line.requestedQty))
}

/** 列表/详情徽章用的展示状态键（映射至 order-status） */
export function resolveOutboundDisplayStatus(status: string, lines: OutboundLineLike[]): string {
  if (status === 'PICKING' && isOutboundReadyToShip(lines)) {
    return 'OUTBOUND_READY_TO_SHIP'
  }
  return status
}

/** 待办列表卡片底部行动文案 */
export function resolveOutboundListAction(status: string, lines: OutboundLineLike[]): string {
  if (status === 'APPROVED') return '去拣货'
  if (status === 'PICKING') {
    return isOutboundReadyToShip(lines) ? '确认出库' : '继续拣货'
  }
  if (status === 'SHIPPED') return '去结案'
  return '查看详情'
}
