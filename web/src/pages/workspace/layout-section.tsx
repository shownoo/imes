import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { RotateCcw } from 'lucide-react'
import { useWorkspace } from 'contexts/workspace-context'
import type { ChetaVisualVariantId } from 'lib/cheta-kpi-institutional'
import type { LeaderStylePresetId } from 'lib/leader-style-presets'
import {
  CONTENT_MARGIN_OPTIONS,
  CONTENT_MAX_WIDTH_OPTIONS,
  DEFAULT_PREFERENCES,
  NAV_LAYOUT_OPTIONS,
  getLayoutPreviewSummary,
  getNavLayoutSummaryLabel,
  type ContentMarginId,
  type ContentMaxWidthId,
  type NavLayoutId,
} from 'lib/workspace-theme'
import {
  formatCurrentComboLabel,
  inferCatalogSelection,
  readStoredColorSchemeId,
  readStoredComboId,
  readStoredDesignSystemId,
  resolveAppearanceApplication,
  syncStoredCatalogWithTheme,
  UI_COLOR_SCHEMES,
  UI_DESIGN_SYSTEMS,
  UI_RECOMMENDED_COMBOS,
  type UiColorSchemeId,
  type UiDesignSystemId,
  type UiRecommendedComboId,
} from 'lib/ui-design-catalog'
import { StyleCatalogPreview } from 'components/style-catalog-card'
import { Button, Card, CardContent } from 'components/common'
import { cn } from 'lib/utils'

type CatalogSelection = {
  designSystemId: UiDesignSystemId
  colorSchemeId: UiColorSchemeId
  comboId: UiRecommendedComboId | null
}

function readCatalogSelection(presetId: LeaderStylePresetId, variant: ChetaVisualVariantId): CatalogSelection {
  const comboId = readStoredComboId()
  if (comboId) {
    const combo = UI_RECOMMENDED_COMBOS.find((c) => c.id === comboId)!
    return { designSystemId: combo.designSystemId, colorSchemeId: combo.colorSchemeId, comboId }
  }
  const ds = readStoredDesignSystemId()
  const cs = readStoredColorSchemeId()
  if (ds && cs) return { designSystemId: ds, colorSchemeId: cs, comboId: null }
  return inferCatalogSelection(presetId, variant)
}

function LayoutMarginIcon() {
  const { t } = useTranslation()
  return (
    <span
      className="inline-flex h-4 w-3 shrink-0 items-center justify-center rounded-[3px] border bg-muted/50"
      style={{ borderColor: 'color-mix(in srgb, var(--leader-card-border) 80%, transparent)' }}
      aria-hidden
    >
      <span className="h-2.5 w-px bg-muted-foreground/45" />
    </span>
  )
}

function InlineToggle<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T
  options: Array<{ id: T; label: string }>
  onChange: (id: T) => void
}) {
  return (
    <div
      className="inline-flex flex-wrap rounded-md border bg-muted/35 p-0.5"
      style={{ borderColor: 'var(--leader-card-border)' }}
      role="group"
    >
      {options.map((opt) => {
        const active = value === opt.id
        return (
          <button
            key={opt.id}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(opt.id)}
            className={cn(
              'min-w-[2.25rem] rounded px-2 py-1 text-xs font-medium tabular-nums transition-colors',
              active
                ? 'bg-background text-foreground shadow-sm ring-1 ring-black/[0.04] dark:ring-white/[0.06]'
                : 'text-muted-foreground hover:bg-background/50 hover:text-foreground',
            )}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}

export function LayoutSection() {
  const { t } = useTranslation()
  const { prefs, setMargin, setMaxWidth, setNavLayout, theme, variant } = useWorkspace()
  const [selection, setSelection] = useState(() => readCatalogSelection(theme.id, variant))

  useEffect(() => {
    setSelection(syncStoredCatalogWithTheme(theme.id, variant))
  }, [theme.id, variant])

  const currentDs = UI_DESIGN_SYSTEMS.find((d) => d.id === selection.designSystemId)!
  const currentCs = UI_COLOR_SCHEMES.find((c) => c.id === selection.colorSchemeId)!
  const resolved = resolveAppearanceApplication(selection.designSystemId, selection.colorSchemeId)
  const preview = selection.comboId
    ? UI_RECOMMENDED_COMBOS.find((c) => c.id === selection.comboId)!.preview
    : resolved.preview

  const marginOptions = CONTENT_MARGIN_OPTIONS.map((o) => ({ id: o.id, label: String(o.px) }))
  const maxWidthOptions = CONTENT_MAX_WIDTH_OPTIONS.map((o) => ({
    id: o.id,
    label: o.id === 'full' ? '100%' : o.id,
  }))

  return (
    <section id="layout">
      <span id="current" className="sr-only" />
      <Card className="leader-panel-card">
        <CardContent className="space-y-3 p-4 sm:p-5">
          <div className="flex items-center gap-3 border-b pb-3" style={{ borderColor: 'var(--leader-card-border)' }}>
            <StyleCatalogPreview preview={preview} height={44} className="w-[4.5rem] shrink-0 rounded-lg" />
            <div className="min-w-0 flex-1">
              <p className="text-[11px] text-muted-foreground">{t('当前')}</p>
              <p className="truncate text-sm font-semibold">
                {formatCurrentComboLabel(selection.designSystemId, selection.colorSchemeId)}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {currentDs.name} + {currentCs.name} · {theme.name}
              </p>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">{t('调整菜单位置、左右边距与内容最大宽度，即刻生效')}</p>

          <div className="flex flex-col gap-3 rounded-lg border p-3" style={{ borderColor: 'var(--leader-card-border)' }}>
            <div className="flex flex-wrap items-center gap-2">
              <span className="shrink-0 text-sm font-medium text-foreground">{t('菜单位置')}</span>
              <span className="text-xs text-muted-foreground">{getNavLayoutSummaryLabel(prefs.navLayout)}</span>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="shrink-0 text-sm text-muted-foreground">{t('切换布局')}</span>
                <InlineToggle<NavLayoutId>
                  value={prefs.navLayout}
                  options={NAV_LAYOUT_OPTIONS.map((o) => ({ id: o.id, label: o.label }))}
                  onChange={setNavLayout}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {NAV_LAYOUT_OPTIONS.find((o) => o.id === prefs.navLayout)?.desc}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 xl:flex-row xl:flex-wrap xl:items-center xl:gap-x-5 xl:gap-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <LayoutMarginIcon />
              <span className="tabular-nums">{getLayoutPreviewSummary(prefs.margin, prefs.maxWidth)}</span>
            </div>

            <div className="flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-5 sm:gap-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="shrink-0 text-sm text-muted-foreground">{t('左右边距')}</span>
                <InlineToggle<ContentMarginId>
                  value={prefs.margin}
                  options={marginOptions}
                  onChange={setMargin}
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className="shrink-0 text-sm text-muted-foreground">{t('内容最大宽度')}</span>
                <InlineToggle<ContentMaxWidthId>
                  value={prefs.maxWidth}
                  options={maxWidthOptions}
                  onChange={setMaxWidth}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-0.5">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs text-muted-foreground"
              onClick={() => {
                setMargin(DEFAULT_PREFERENCES.margin)
                setMaxWidth(DEFAULT_PREFERENCES.maxWidth)
                setNavLayout(DEFAULT_PREFERENCES.navLayout)
              }}
            >
              <RotateCcw className="size-3" />{t('恢复默认')}</Button>
          </div>
        </CardContent>
      </Card>
    </section>
  )
}
