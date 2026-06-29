import { useEffect, useState } from 'react'
import { useWorkspace } from 'contexts/workspace-context'
import { LEADER_STYLE_PRESET_CHANGE } from 'lib/workspace-theme'
import type { ChetaVisualVariantId } from 'lib/cheta-kpi-institutional'
import type { LeaderStylePresetId } from 'lib/leader-style-presets'
import {
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
import { StyleCatalogCard } from 'components/style-catalog-card'

type CatalogSelection = {
  designSystemId: UiDesignSystemId
  colorSchemeId: UiColorSchemeId
  comboId: UiRecommendedComboId | null
}

function readInitialSelection(
  presetId: LeaderStylePresetId,
  variant: ChetaVisualVariantId,
): CatalogSelection {
  const comboId = readStoredComboId()
  if (comboId) {
    const combo = UI_RECOMMENDED_COMBOS.find((c) => c.id === comboId)!
    return { designSystemId: combo.designSystemId, colorSchemeId: combo.colorSchemeId, comboId }
  }
  const ds = readStoredDesignSystemId()
  const cs = readStoredColorSchemeId()
  if (ds && cs) {
    return { designSystemId: ds, colorSchemeId: cs, comboId: null }
  }
  return inferCatalogSelection(presetId, variant)
}

export function AppearanceCatalogSection() {
  const { theme, variant, setThemeId, setVisualVariant } = useWorkspace()
  const [selection, setSelection] = useState<CatalogSelection>(() =>
    readInitialSelection(theme.id, variant),
  )

  useEffect(() => {
    const inferred = syncStoredCatalogWithTheme(theme.id, variant)
    setSelection(inferred)
  }, [theme.id, variant])

  const persist = (next: CatalogSelection) => {
    localStorage.setItem('imes-ui-design-system-id', next.designSystemId)
    localStorage.setItem('imes-ui-color-scheme-id', next.colorSchemeId)
    if (next.comboId) localStorage.setItem('imes-ui-recommended-combo-id', next.comboId)
    else localStorage.removeItem('imes-ui-recommended-combo-id')
    setSelection(next)
    window.dispatchEvent(new CustomEvent(LEADER_STYLE_PRESET_CHANGE))
  }

  const applyPair = (
    designSystemId: UiDesignSystemId,
    colorSchemeId: UiColorSchemeId,
    comboId: UiRecommendedComboId | null,
  ) => {
    const app = resolveAppearanceApplication(designSystemId, colorSchemeId)
    persist({ designSystemId, colorSchemeId, comboId: comboId ?? app.comboId })
    setVisualVariant(app.variant)
    setThemeId(app.presetId)
  }

  const applyDesignSystem = (id: UiDesignSystemId) => {
    applyPair(id, selection.colorSchemeId, null)
  }

  const applyColorScheme = (id: UiColorSchemeId) => {
    applyPair(selection.designSystemId, id, null)
  }

  const applyCombo = (id: UiRecommendedComboId) => {
    const combo = UI_RECOMMENDED_COMBOS.find((c) => c.id === id)!
    applyPair(combo.designSystemId, combo.colorSchemeId, id)
  }

  const isComboActive = (combo: (typeof UI_RECOMMENDED_COMBOS)[number]) =>
    selection.comboId === combo.id
    || (selection.comboId === null
      && theme.id === combo.presetId
      && selection.designSystemId === combo.designSystemId
      && selection.colorSchemeId === combo.colorSchemeId)

  return (
    <div className="space-y-10">
      <section id="recommended-combos">
        <div className="mb-4">
          <h2 className="text-lg font-bold">'推荐组合'</h2>
          <p className="mt-1 text-sm text-muted-foreground">'设计语言 + 色系一键应用，保证导航、卡片与 KPI 视觉一致'</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {UI_RECOMMENDED_COMBOS.map((combo) => (
            <StyleCatalogCard
              key={combo.id}
              title={combo.name}
              desc={combo.desc}
              preview={combo.preview}
              active={isComboActive(combo)}
              onClick={() => applyCombo(combo.id)}
              compact
            />
          ))}
        </div>
      </section>

      <section id="design-language">
        <div className="mb-4">
          <h2 className="text-lg font-bold">'设计语言'</h2>
          <p className="mt-1 text-sm text-muted-foreground">'选择界面范式（Material / Fluent / Apple / Carbon 等），与色系联动应用'</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {UI_DESIGN_SYSTEMS.map((ds) => (
            <StyleCatalogCard
              key={ds.id}
              title={ds.name}
              desc={ds.desc}
              preview={ds.preview}
              active={selection.designSystemId === ds.id}
              onClick={() => applyDesignSystem(ds.id)}
            />
          ))}
        </div>
      </section>

      <section id="color-schemes">
        <div className="mb-4">
          <h2 className="text-lg font-bold">'色系'</h2>
          <p className="mt-1 text-sm text-muted-foreground">'校色 / 品牌 / 政务 / 学术 — 顶栏与 KPI 强调色身份'</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {UI_COLOR_SCHEMES.map((cs) => (
            <StyleCatalogCard
              key={cs.id}
              title={cs.name}
              desc={cs.desc}
              preview={cs.preview}
              active={selection.colorSchemeId === cs.id}
              onClick={() => applyColorScheme(cs.id)}
              compact
            />
          ))}
        </div>
      </section>

      <span id="appearance" className="sr-only" />
    </div>
  )
}
