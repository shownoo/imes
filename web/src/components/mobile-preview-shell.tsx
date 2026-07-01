import { useEffect, useMemo, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Monitor, Smartphone, X } from 'lucide-react'
import { Button } from 'components/ui/button'
import { useDevicePreview } from 'contexts/device-preview-context'
import { useMobileEmbed } from 'hooks/use-mobile-embed'
import { useViewportMobile } from 'hooks/use-viewport-mobile'
import { buildMobileEmbedSrc, MOBILE_EMBED_QUERY } from 'lib/device-preview'

export function MobilePreviewShell({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation()
  const { inPhonePreview, mobilePreview, setPreview } = useDevicePreview()
  const isEmbed = useMobileEmbed()
  const viewportMobile = useViewportMobile()
  const location = useLocation()
  const navigate = useNavigate()
  const iframeRef = useRef<HTMLIFrameElement>(null)

  const isTopLevelEmbed =
    isEmbed && typeof window !== 'undefined' && window.parent === window && !viewportMobile

  useEffect(() => {
    if (!isTopLevelEmbed) return
    if (!mobilePreview) setPreview('mobile')
    const params = new URLSearchParams(location.search)
    params.delete(MOBILE_EMBED_QUERY)
    const q = params.toString()
    navigate({ pathname: location.pathname, search: q ? `?${q}` : '' }, { replace: true })
  }, [isTopLevelEmbed, mobilePreview, setPreview, location.pathname, location.search, navigate])

  const embedSrc = useMemo(
    () => buildMobileEmbedSrc(location.pathname, location.search),
    [location.pathname, location.search],
  )

  useEffect(() => {
    if (!inPhonePreview || isEmbed) return
    const iframe = iframeRef.current
    if (!iframe) return
    try {
      const win = iframe.contentWindow
      if (!win) return
      const currentPath = `${win.location.pathname}${win.location.search}`
      if (currentPath !== embedSrc) iframe.src = embedSrc
    } catch {
      iframe.src = embedSrc
    }
  }, [inPhonePreview, isEmbed, embedSrc])

  if (isTopLevelEmbed) return null

  if (isEmbed) return <>{children}</>

  if (!inPhonePreview) return <>{children}</>

  return (
    <div className="mobile-preview-stage">
      <div className="mobile-preview-chrome">
        <div className="flex min-w-0 items-center gap-2 text-sm text-white/90">
          <Smartphone className="size-4 shrink-0" aria-hidden />
          <span className="truncate">{t('手机预览 · 仓管操作界面')}</span>
        </div>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="h-8 shrink-0 gap-1.5 bg-white/10 text-white hover:bg-white/20"
          onClick={() => setPreview('desktop')}
        >
          <Monitor className="size-3.5" />
          {t('退出预览')}
          <X className="size-3.5 opacity-70" />
        </Button>
      </div>

      <div className="mobile-preview-device">
        <div className="mobile-preview-notch" aria-hidden />
        <iframe
          ref={iframeRef}
          title={t('手机预览 · 仓管操作界面')}
          src={embedSrc}
          className="mobile-preview-iframe"
        />
      </div>
    </div>
  )
}
