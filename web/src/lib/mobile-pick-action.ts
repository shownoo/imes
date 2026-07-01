import { translate } from 'locales'
/** 明细行 — 执行扫码拣货 */
export function pickActionLabel(options: {
  pending: number
  requested: number
  started?: boolean
}): string {
  if (options.pending <= 0) return translate('查看详情')
  if (options.started || options.pending < options.requested) return translate('继续扫码拣货')
  return translate('扫码拣货')
}
