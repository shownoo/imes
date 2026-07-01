import { useQuery } from '@apollo/client'
import { useTranslation } from 'react-i18next'
import {
  APP_LICENSEE_FALLBACK,
  APP_PRODUCT_NAME,
  APP_VENDOR,
  formatAppVersionLabel,
  formatCopyrightLine,
} from 'lib/app-info'
import { GET_ORG_LICENSEE } from 'lib/app-about-queries'

type AppAboutPanelProps = {
  className?: string
}

/** 关于信息（菜单 / 系统管理复用） */
export function AppAboutPanel({ className }: AppAboutPanelProps) {
  const { t } = useTranslation()
  const { data } = useQuery(GET_ORG_LICENSEE, { fetchPolicy: 'cache-first' })
  const licensee =
    String((data?.getOrgLicensee as { name?: string } | undefined)?.name ?? '').trim() ||
    APP_LICENSEE_FALLBACK

  return (
    <div className={className}>
      <p className="text-sm font-medium leading-snug">{APP_PRODUCT_NAME}</p>
      <p className="mt-2 text-xs text-muted-foreground">
        {t('版本')}：{formatAppVersionLabel()}
      </p>
      <div className="my-2.5 h-px bg-border" />
      <p className="text-xs text-muted-foreground">
        {t('授权单位')}：{licensee}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        {t('开发单位')}：{APP_VENDOR}
      </p>
      <p className="mt-2 text-[10px] text-muted-foreground/80">
        {t('版权所有')} {formatCopyrightLine()}
      </p>
    </div>
  )
}
