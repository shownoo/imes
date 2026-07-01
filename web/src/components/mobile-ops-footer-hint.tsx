import { useTranslation } from 'react-i18next'
type MobileOpsFooterHintProps = {
  /** 待完成数量 */
  pending: number
  /** 动作名，如「待收」「待拣」 */
  action: string
}

/** 详情页底部 — 未完成时的轻量进度提示（非按钮） */
export function MobileOpsFooterHint({ pending, action }: MobileOpsFooterHintProps) {
  const { t } = useTranslation()
  return (
    <p className="mobile-ops-footer-hint">
      <span className="mobile-ops-footer-hint-prefix">{t('还差')}</span>
      <span className="mobile-ops-footer-hint-value">{pending.toLocaleString()}</span>
      <span className="mobile-ops-footer-hint-suffix">{action}</span>
    </p>
  )
}
