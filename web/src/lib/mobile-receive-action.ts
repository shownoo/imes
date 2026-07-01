import { translate } from 'locales'
export type ReceiveListActionTone = 'continue' | 'start' | 'view'

export type ReceiveListAction = {
  label: string
  tone: ReceiveListActionTone
}

function resolveReceiveListAction(options: {
  pending: number
  expected: number
  started?: boolean
  viewOnly?: boolean
}): ReceiveListAction {
  if (options.viewOnly || options.pending <= 0) {
    return { label: translate('查看详情'), tone: 'view' }
  }
  if (options.started || options.pending < options.expected) {
    return { label: translate('继续收货'), tone: 'continue' }
  }
  return { label: translate('去收货'), tone: 'start' }
}

/** 列表卡片 — 导航进入收货详情（Apple：整卡可点 + 轻量 disclosure） */
export function receiveListActionLabel(options: {
  pending: number
  expected: number
  started?: boolean
  viewOnly?: boolean
}): string {
  return resolveReceiveListAction(options).label
}

/** 列表卡片 — 文案 + 视觉层次（进行中强调 / 未开始弱化） */
export function receiveListAction(options: {
  pending: number
  expected: number
  started?: boolean
  viewOnly?: boolean
}): ReceiveListAction {
  return resolveReceiveListAction(options)
}

/** 明细行 — 执行收货赋码 */
export function receiveActionLabel(options: {
  pending: number
  expected: number
  started?: boolean
  viewOnly?: boolean
}): string {
  if (options.viewOnly || options.pending <= 0) return translate('查看详情')
  if (options.started || options.pending < options.expected) return translate('继续收货赋码')
  return translate('收货赋码')
}
