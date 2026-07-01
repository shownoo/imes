import { Palette } from 'lucide-react'
import { useWorkspace } from 'contexts/workspace-context'
import { THEME_PRESETS, type ThemePresetId } from 'lib/workspace-theme'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from 'components/ui/select'
import { Label } from 'components/ui/label'
import { useTranslation } from 'react-i18next'

export function ThemePresetSelector({ compact }: { compact?: boolean }) {
  const { t } = useTranslation()
  const { theme, setThemeId } = useWorkspace()

  if (compact) {
    return (
      <Select value={theme.id} onValueChange={(v) => setThemeId(v as ThemePresetId)}>
        <SelectTrigger className="h-8 w-[130px] border-[var(--leader-card-border)] bg-[var(--leader-card-bg)] text-xs">
          <Palette className="mr-1 size-3.5 shrink-0 opacity-70" />
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {THEME_PRESETS.map((p) => (
            <SelectItem key={p.id} value={p.id}>
              <span className="flex items-center gap-2">
                <span className="size-2.5 rounded-full" style={{ backgroundColor: p.preview.accent }} />
                {p.name}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    )
  }

  return (
    <div className="space-y-2">
      <Label className="text-xs text-muted-foreground">{t('界面风格')}</Label>
      <Select value={theme.id} onValueChange={(v) => setThemeId(v as ThemePresetId)}>
        <SelectTrigger className="leader-panel-card">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {THEME_PRESETS.map((p) => (
            <SelectItem key={p.id} value={p.id}>
              <div className="flex flex-col gap-0.5 py-0.5">
                <span className="flex items-center gap-2 font-medium">
                  <span className="size-2.5 rounded-full" style={{ backgroundColor: p.preview.accent }} />
                  {p.name}
                </span>
                <span className="text-xs text-muted-foreground">{p.desc}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
