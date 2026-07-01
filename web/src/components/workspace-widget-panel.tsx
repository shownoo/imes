import { Link } from 'react-router-dom'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { useWorkspace } from 'contexts/workspace-context'
import { VIEW_PERSPECTIVES } from 'lib/workspace-theme'
import { styleSwitcherMenuChrome, type StyleSwitcherMenuTheme } from 'lib/theme-customizer-surfaces'

function WidgetRow({
  label,
  visible,
  disabledUp,
  disabledDown,
  onToggle,
  onMoveUp,
  onMoveDown,
  chrome,
}: {
  label: string
  visible: boolean
  disabledUp: boolean
  disabledDown: boolean
  onToggle: () => void
  onMoveUp: () => void
  onMoveDown: () => void
  chrome: ReturnType<typeof styleSwitcherMenuChrome>
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
        padding: '7px 10px',
        borderRadius: 6,
        transition: 'background 0.15s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = chrome.itemActiveBg
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'transparent'
      }}
    >
      <label
        style={{
          display: 'flex',
          flex: 1,
          alignItems: 'center',
          gap: 8,
          cursor: 'pointer',
          fontSize: 13,
          lineHeight: 1.45,
          color: visible ? chrome.titleColor : chrome.itemColor,
          fontWeight: visible ? 500 : 400,
        }}
      >
        <input
          type="checkbox"
          checked={visible}
          onChange={onToggle}
          style={{ width: 14, height: 14, accentColor: chrome.itemActiveColor }}
        />
        <span>{label}</span>
        {!visible && (
          <span style={{ fontSize: 11, opacity: 0.65, color: chrome.mutedColor }}>已隐藏</span>
        )}
      </label>
      <div style={{ display: 'flex', gap: 2 }}>
        <button
          type="button"
          aria-label={`上移 ${label}`}
          disabled={disabledUp}
          onClick={onMoveUp}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 26,
            height: 26,
            border: 'none',
            borderRadius: 6,
            background: 'transparent',
            color: chrome.mutedColor,
            cursor: disabledUp ? 'default' : 'pointer',
            opacity: disabledUp ? 0.35 : 1,
          }}
        >
          <ChevronUp size={14} />
        </button>
        <button
          type="button"
          aria-label={`下移 ${label}`}
          disabled={disabledDown}
          onClick={onMoveDown}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 26,
            height: 26,
            border: 'none',
            borderRadius: 6,
            background: 'transparent',
            color: chrome.mutedColor,
            cursor: disabledDown ? 'default' : 'pointer',
            opacity: disabledDown ? 0.35 : 1,
          }}
        >
          <ChevronDown size={14} />
        </button>
      </div>
    </div>
  )
}

/** 工作台模块配置面板内容 — 供页内下拉与账号设置复用 */
export function WorkspaceWidgetPanel({
  theme = 'light',
  onNavigateSettings,
  showSettingsLink = true,
  showHeader = true,
}: {
  theme?: StyleSwitcherMenuTheme
  onNavigateSettings?: () => void
  showSettingsLink?: boolean
  showHeader?: boolean
}) {
  const { prefs, toggleWidget, moveWidget, applyPerspective } = useWorkspace()
  const chrome = styleSwitcherMenuChrome(theme)
  const visibleCount = prefs.widgets.filter((w) => w.visible).length

  return (
    <>
      {showHeader ? (
        <div style={{ padding: '6px 10px 4px' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: chrome.titleColor, lineHeight: 1.45 }}>
            工作台模块
          </div>
          <div style={{ fontSize: 11, opacity: 0.65, marginTop: 2, lineHeight: 1.4, color: chrome.mutedColor }}>
            控制卡片显示与排列 · 已开启 {visibleCount}/{prefs.widgets.length}
          </div>
        </div>
      ) : null}

      <ul
        style={{
          margin: 0,
          padding: '2px 0',
          listStyle: 'none',
          maxHeight: 360,
          overflowY: 'auto',
        }}
      >
        {prefs.widgets.map((w, i) => (
          <li key={w.id}>
            <WidgetRow
              label={w.label}
              visible={w.visible}
              disabledUp={i === 0}
              disabledDown={i === prefs.widgets.length - 1}
              onToggle={() => toggleWidget(w.id)}
              onMoveUp={() => moveWidget(w.id, -1)}
              onMoveDown={() => moveWidget(w.id, 1)}
              chrome={chrome}
            />
          </li>
        ))}
      </ul>

      <div style={{ marginTop: 4, paddingTop: 8, borderTop: chrome.divider }}>
        <div
          style={{
            padding: '0 10px 6px',
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: '0.02em',
            color: chrome.mutedColor,
            textTransform: 'uppercase',
          }}
        >
          角色视角
        </div>
        {VIEW_PERSPECTIVES.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => applyPerspective(p.id)}
            style={{
              display: 'block',
              width: '100%',
              textAlign: 'left',
              padding: '9px 12px',
              border: 'none',
              borderRadius: 6,
              background: 'transparent',
              color: chrome.itemColor,
              fontSize: 13,
              lineHeight: 1.45,
              fontWeight: 400,
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = chrome.itemActiveBg
              e.currentTarget.style.color = chrome.itemActiveColor
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.color = chrome.itemColor
            }}
          >
            <div>{p.label}</div>
            <div style={{ fontSize: 11, opacity: 0.65, marginTop: 2, lineHeight: 1.4 }}>{p.desc}</div>
          </button>
        ))}
      </div>

      {showSettingsLink ? (
        <div style={{ marginTop: 4, paddingTop: 8, borderTop: chrome.divider }}>
          <Link
            to="/workspace#widgets"
            onClick={onNavigateSettings}
            style={{
              display: 'block',
              padding: '9px 12px',
              fontSize: 12,
              lineHeight: 1.45,
              color: chrome.mutedColor,
              textDecoration: 'none',
              borderRadius: 6,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = chrome.itemActiveBg
              e.currentTarget.style.color = chrome.itemActiveColor
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.color = chrome.mutedColor
            }}
          >
            全部偏好设置…
          </Link>
        </div>
      ) : null}
    </>
  )
}
