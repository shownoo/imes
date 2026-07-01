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
  Monitor,
  Smartphone,
  Briefcase,
  Package,
  Info,
  Check,
} from 'lucide-react'
import { clearAuth, getStoredUser } from 'lib/apollo'
import { getRoleLabel } from 'lib/auth'
import { AppAboutPanel } from 'components/app-about-panel'
import { WORK_MODES } from 'lib/work-mode'
import { DEVICE_PREVIEW_OPTIONS } from 'lib/device-preview'
import { useWorkMode } from 'contexts/work-mode-context'
import { useDevicePreview } from 'contexts/device-preview-context'
import i18n, { LanguageType, LANGUAGE_OPTIONS } from 'locales'
import { sidebarFooterButtonClass } from 'lib/nav-styles'
import { Tooltip, TooltipContent, TooltipTrigger } from 'components/ui/tooltip'
import { cn } from 'lib/utils'
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

function MenuSelectionIndicator({ selected }: { selected: boolean }) {
  return (
    <span
      className={cn(
        'mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-[4px] border transition-colors',
        selected
          ? 'border-primary bg-primary text-primary-foreground'
          : 'border-border/80 bg-background',
      )}
      aria-hidden
    >
      {selected && <Check className="size-2.5" strokeWidth={3} />}
    </span>
  )
}

function WorkModeMenuItem({
  selected,
  onClick,
  icon: Icon,
  label,
  desc,
  disabled,
}: {
  selected: boolean
  onClick?: () => void
  icon: typeof Briefcase
  label: string
  desc: string
  disabled?: boolean
}) {
  return (
    <DropdownMenuItem
      onClick={onClick}
      disabled={disabled}
      aria-current={selected ? 'true' : undefined}
      className={cn(
        'items-start gap-2.5 py-2.5',
        selected && 'bg-primary/10 font-medium',
      )}
    >
      <MenuSelectionIndicator selected={selected} />
      <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" strokeWidth={1.75} />
      <span className="flex min-w-0 flex-col gap-0.5">
        <span>{label}</span>
        <span className="text-[10px] font-normal text-muted-foreground">{desc}</span>
      </span>
    </DropdownMenuItem>
  )
}

function LanguageMenuItem({
  selected,
  label,
  onClick,
}: {
  selected: boolean
  label: string
  onClick: () => void
}) {
  return (
    <DropdownMenuItem
      onClick={onClick}
      aria-current={selected ? 'true' : undefined}
      className={cn('gap-2.5', selected && 'bg-primary/10 font-medium')}
    >
      <MenuSelectionIndicator selected={selected} />
      {label}
    </DropdownMenuItem>
  )
}

export function UserMenu({
  placement = 'header',
  collapsed = false,
}: {
  placement?: 'header' | 'sidebar'
  collapsed?: boolean
}) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const user = getStoredUser()
  const { mode, canSwitch, setMode } = useWorkMode()
  const { preview, setPreview } = useDevicePreview()
  const displayName = user?.name ?? user?.username ?? t('用户')
  const roleLabel = user?.role ? getRoleLabel(user.role) : user?.roleName ?? user?.role ?? ''
  const showRole = Boolean(roleLabel && roleLabel !== displayName)
  const currentLang = i18n.language?.startsWith('en') ? LanguageType.EN_US : LanguageType.ZH_CN

  const logout = () => {
    clearAuth()
    navigate('/login')
  }

  const isSidebar = placement === 'sidebar'

  const sidebarButton = (
    <button type="button" className={cn(sidebarFooterButtonClass(collapsed), 'w-full')}>
      <span
        className={cn(
          'flex shrink-0 items-center justify-center rounded-full bg-muted/60',
          collapsed ? 'size-7' : 'size-6',
        )}
      >
        <User className="size-3.5 text-muted-foreground" strokeWidth={1.75} />
      </span>
      {!collapsed && (
        <>
          <span className="min-w-0 flex-1 truncate text-[13px] font-normal leading-none">
            {displayName}
            {showRole && (
              <span className="mt-0.5 block truncate text-[10px] uppercase tracking-wide text-muted-foreground/80">
                {roleLabel}
              </span>
            )}
          </span>
          <ChevronDown className="size-3.5 shrink-0 text-muted-foreground/50" />
        </>
      )}
    </button>
  )

  const sidebarTrigger = collapsed ? (
    <Tooltip>
      <TooltipTrigger asChild>
        <DropdownMenuTrigger asChild>{sidebarButton}</DropdownMenuTrigger>
      </TooltipTrigger>
      <TooltipContent side="right">{displayName}</TooltipContent>
    </Tooltip>
  ) : (
    <DropdownMenuTrigger asChild>{sidebarButton}</DropdownMenuTrigger>
  )

  return (
    <DropdownMenu>
      {isSidebar ? (
        sidebarTrigger
      ) : (
        <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex h-9 max-w-[9rem] items-center gap-1.5 rounded-lg px-1 text-left transition-colors hover:bg-black/[0.04] dark:hover:bg-white/[0.06] lg:max-w-[12rem] lg:gap-2 lg:px-2"
        >
          <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted/60 lg:size-6">
            <User className="size-3.5 text-muted-foreground lg:size-3" strokeWidth={1.75} />
          </span>
          <span className="hidden min-w-0 flex-1 truncate text-[13px] font-normal leading-none lg:block">
            {displayName}
            {showRole && (
              <span className="mt-0.5 block truncate text-[10px] uppercase tracking-wide text-muted-foreground/80">
                {roleLabel}
              </span>
            )}
          </span>
          <ChevronDown className="size-3.5 shrink-0 text-muted-foreground/50 lg:size-3" />
        </button>
        </DropdownMenuTrigger>
      )}
      <DropdownMenuContent align={isSidebar ? 'start' : 'end'} side={isSidebar ? 'top' : 'bottom'} className="w-52">
        <DropdownMenuLabel className="font-normal">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{t('账号')}</p>
          <p className="mt-1.5 text-sm font-medium">{displayName}</p>
          {showRole && <p className="text-xs text-muted-foreground">{roleLabel}</p>}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          {t('工作模式')}
        </DropdownMenuLabel>
        {canSwitch ? (
          WORK_MODES.map((item) => (
            <WorkModeMenuItem
              key={item.id}
              selected={mode === item.id}
              onClick={() => setMode(item.id)}
              icon={item.id === 'management' ? Briefcase : Package}
              label={item.label}
              desc={item.desc}
            />
          ))
        ) : (
          WORK_MODES.filter((item) => item.id === mode).map((item) => (
            <WorkModeMenuItem
              key={item.id}
              selected
              disabled
              icon={item.id === 'management' ? Briefcase : Package}
              label={item.label}
              desc={item.desc}
            />
          ))
        )}
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          {t('操作端')}
        </DropdownMenuLabel>
        {DEVICE_PREVIEW_OPTIONS.map((item) => (
          <WorkModeMenuItem
            key={item.id}
            selected={preview === item.id}
            onClick={() => setPreview(item.id)}
            icon={item.id === 'desktop' ? Monitor : Smartphone}
            label={t(item.label)}
            desc={t(item.desc)}
          />
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <Globe className="mr-2 size-4" />
            {t('语言')}
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            {LANGUAGE_OPTIONS.map((opt) => (
              <LanguageMenuItem
                key={opt.value}
                selected={currentLang === opt.value}
                label={t(opt.labelKey)}
                onClick={() => i18n.changeLanguage(opt.value)}
              />
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
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <Info className="mr-2 size-4" />
            {t('关于')}
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="w-60 p-3">
            <AppAboutPanel />
          </DropdownMenuSubContent>
        </DropdownMenuSub>
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
