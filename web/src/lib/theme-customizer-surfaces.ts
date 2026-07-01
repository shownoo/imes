/** 主题/偏好面板实底样式 — 对齐 neoWebSchool theme-customizer-surfaces.ts */
export const themeCustomizerPanelClass =
  'overflow-visible border border-slate-200 bg-white text-slate-900 shadow-xl dark:border-white/12 dark:bg-[#1c1c1e] dark:text-[#f5f5f7]'

export type StyleSwitcherMenuTheme = 'light' | 'dark'

export function styleSwitcherMenuChrome(theme: StyleSwitcherMenuTheme) {
  const isDark = theme === 'dark'
  return {
    isDark,
    trigger: {
      display: 'inline-flex' as const,
      alignItems: 'center' as const,
      gap: 4,
      padding: '6px 10px',
      borderRadius: 8,
      border: isDark ? '1px solid rgba(255,255,255,0.12)' : '1px solid rgba(0,0,0,0.08)',
      background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
      color: isDark ? '#94A3B8' : '#64748B',
      fontSize: 12,
      cursor: 'pointer' as const,
      whiteSpace: 'nowrap' as const,
    },
    panel: {
      background: isDark ? '#1a222c' : '#fff',
      border: isDark ? '1px solid rgba(255,255,255,0.12)' : '1px solid #e2e8f0',
      borderRadius: 10,
      boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
      padding: 6,
      zIndex: 9999,
    },
    divider: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #e2e8f0',
    itemActiveBg: isDark ? 'rgba(0,209,255,0.15)' : '#f1f5f9',
    itemActiveColor: isDark ? '#00D1FF' : '#0f172a',
    itemColor: isDark ? '#cbd5e1' : '#475569',
    mutedColor: isDark ? '#94A3B8' : '#64748B',
    titleColor: isDark ? '#f1f5f9' : '#0f172a',
  }
}
