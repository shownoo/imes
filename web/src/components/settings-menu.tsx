import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  ChevronDown,
  Globe,
  LayoutGrid,
  LayoutDashboard,
  LogOut,
  Maximize2,
  Palette,
  Sparkles,
  User,
} from 'lucide-react'
import { clearAuth, getStoredUser } from 'lib/apollo'
import { getRoleLabel } from 'lib/auth'
import i18n, { LanguageType, LANGUAGE_OPTIONS } from 'locales'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from 'components/ui/dropdown-menu'

export function UserMenu() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const user = getStoredUser()
  const displayName = user?.name ?? user?.username ?? t('用户')
  const roleLabel = user?.role ? getRoleLabel(user.role) : user?.roleName ?? user?.role ?? ''
  const showRole = Boolean(roleLabel && roleLabel !== displayName)
  const currentLang = i18n.language?.startsWith('en') ? LanguageType.EN_US : LanguageType.ZH_CN

  const logout = () => {
    clearAuth()
    navigate('/login')
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex h-9 max-w-[9rem] items-center gap-1.5 rounded-lg px-1 text-left transition-colors hover:bg-black/[0.04] dark:hover:bg-white/[0.06] xl:max-w-[12rem] xl:gap-2 xl:px-2"
        >
          <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted/60">
            <User className="size-3 text-muted-foreground" strokeWidth={2} />
          </span>
          <span
            className="hidden min-w-0 truncate text-[13px] font-normal leading-none xl:block"
            style={{ color: 'var(--leader-text-secondary, inherit)' }}
          >
            {displayName}
            {showRole && (
              <span className="mt-0.5 block truncate text-[10px] uppercase tracking-wide text-muted-foreground/80">
                {roleLabel}
              </span>
            )}
          </span>
          <ChevronDown className="size-3 shrink-0 text-muted-foreground/50" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel className="font-normal">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{t('账号')}</p>
          <p className="mt-1.5 text-sm font-medium">{displayName}</p>
          {showRole && <p className="text-xs text-muted-foreground">{roleLabel}</p>}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <Globe className="mr-2 size-4" />
            {t('语言')}
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            {LANGUAGE_OPTIONS.map((opt) => (
              <DropdownMenuItem
                key={opt.value}
                onClick={() => i18n.changeLanguage(opt.value)}
                className={currentLang === opt.value ? 'font-medium' : undefined}
              >
                {t(opt.labelKey)}
              </DropdownMenuItem>
            ))}
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          {t('个人偏好')}
        </DropdownMenuLabel>
        <DropdownMenuItem onClick={() => navigate('/workspace#layout')}>
          <Maximize2 className="mr-2 size-4" />
          {t('内容区布局')}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate('/workspace#layout')}>
          <Sparkles className="mr-2 size-4" />
          {t('当前风格')}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate('/workspace#recommended-combos')}>
          <Sparkles className="mr-2 size-4" />
          {t('推荐组合')}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate('/workspace#design-language')}>
          <LayoutGrid className="mr-2 size-4" />
          {t('设计语言')}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate('/workspace#color-schemes')}>
          <Palette className="mr-2 size-4" />
          {t('色系')}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate('/workspace#widgets')}>
          <LayoutDashboard className="mr-2 size-4" />
          {t('工作台模块')}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate('/workspace')} className="text-muted-foreground">
          {t('全部偏好设置…')}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive">
          <LogOut className="mr-2 size-4" />
          {t('退出登录')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/** @deprecated 使用 UserMenu */
export const SettingsMenu = UserMenu
