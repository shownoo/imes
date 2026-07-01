import { useNavigate } from 'react-router-dom'
import { MobileOpsCrumbBar } from 'components/mobile-ops-crumb-bar'
import { ChevronRight } from 'lucide-react'
import { clearAuth, getStoredUser } from 'lib/apollo'
import { getRoleLabel } from 'lib/auth'
import { MOBILE_OPS_ME_LIST } from 'lib/mobile-ops-tools'
import { useTranslation } from 'react-i18next'

export default function OpsMobileMe() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const user = getStoredUser()
  const displayName = user?.name ?? user?.username ?? '用户'
  const roleLabel = user?.role ? getRoleLabel(user.role) : ''
  const profileMeta =
    roleLabel && roleLabel !== displayName
      ? roleLabel
      : user?.username && user.username !== displayName
        ? user.username
        : ''

  const logout = () => {
    clearAuth()
    navigate('/login')
  }

  return (
    <div className="mobile-ops-page mobile-ops-page--tab-root">
      <MobileOpsCrumbBar title={t('我的')} />
      <div className="mobile-ops-page-body space-y-4 pb-8">
        <section className="mobile-ops-profile">
          <p className="mobile-ops-profile-name">{displayName}</p>
          {profileMeta && <p className="mobile-ops-profile-meta">{profileMeta}</p>}
        </section>

        <section>
          <h2 className="mobile-ops-section-title">{t('现场工具')}</h2>
          <div className="mobile-ops-card mobile-ops-grouped-list">
            {MOBILE_OPS_ME_LIST.map(({ to, icon: Icon, label, desc }, index) => (
              <div key={to}>
                {index > 0 && <div className="mobile-ops-grouped-divider" aria-hidden />}
                <button type="button" onClick={() => navigate(to)} className="mobile-ops-nav-row">
                  <span className="mobile-ops-nav-row-icon">
                    <Icon className="size-5" strokeWidth={1.75} />
                  </span>
                  <span className="mobile-ops-nav-row-body">
                    <span className="mobile-ops-nav-row-label">{label}</span>
                    <span className="mobile-ops-nav-row-desc">{desc}</span>
                  </span>
                  <ChevronRight className="mobile-ops-action-chevron" />
                </button>
              </div>
            ))}
          </div>
        </section>

        <button type="button" className="mobile-ops-sign-out" onClick={logout}>{t('退出登录')}</button>
      </div>
    </div>
  )
}
