/** 入库单展示层 — 与 outbound-display 对称的双层模型 */

export type InboundLineLike = {
  expectedQty: number
  actualQty?: number | null
}

export function isInboundReadyToComplete(lines: InboundLineLike[]): boolean {
  if (lines.length === 0) return false
  return lines.every((line) => Number(line.actualQty ?? 0) >= Number(line.expectedQty))
}

export function resolveInboundDisplayStatus(status: string, lines: InboundLineLike[]): string {
  if (status === 'RECEIVING' && isInboundReadyToComplete(lines)) {
    return 'INBOUND_READY_TO_COMPLETE'
  }
  return status
}

export function resolveInboundListAction(status: string, lines: InboundLineLike[]): string {
  if (status === 'RECEIVING') {
    return isInboundReadyToComplete(lines) ? '完成入库' : '继续收货'
  }
  return '查看详情'
}
