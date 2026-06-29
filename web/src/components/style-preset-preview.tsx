import type { LeaderStylePreset } from 'lib/leader-style-presets'

type StylePreview = LeaderStylePreset['preview']
import { cn } from 'lib/utils'

type StylePresetPreviewProps = {
  preview: StylePreview
  className?: string
  height?: number
}

/** neoWebSchool 风格缩略色卡：顶栏 + 双卡网格 */
export function StylePresetPreview({ preview, className, height = 30 }: StylePresetPreviewProps) {
  const pv = preview
  return (
    <div
      aria-hidden
      className={cn('w-full overflow-hidden', className)}
      style={{
        height,
        borderRadius: 7,
        background: pv.bg,
        border: `1px solid ${pv.border}`,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div style={{ height: Math.max(7, height * 0.23), background: pv.nav, opacity: 0.92 }} />
      <div
        style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 4,
          padding: 4,
        }}
      >
        <div
          style={{
            borderRadius: 4,
            background: pv.card,
            border: `1px solid ${pv.border}`,
          }}
        />
        <div
          style={{
            borderRadius: 4,
            background: pv.card,
            border: `1px solid ${pv.accent}66`,
          }}
        />
      </div>
    </div>
  )
}
