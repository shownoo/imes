import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getStoredUser } from 'lib/apollo'
import { useAuth } from 'lib/auth'
import {
  type DevicePreviewId,
  isMobilePreviewActive,
  readStoredDevicePreview,
  saveDevicePreview,
} from 'lib/device-preview'
import { useViewportMobile } from 'hooks/use-viewport-mobile'

import { getDefaultLandingPath } from 'lib/work-mode'
import { MOBILE_OPS_HOME, resolveDefaultLandingPath } from 'lib/mobile-ops'
import { useWorkMode } from 'contexts/work-mode-context'

type DevicePreviewContextValue = {
  preview: DevicePreviewId
  /** 已选手机端（含真机访问） */
  mobilePreview: boolean
  /** 桌面浏览器内的手机外框预览 */
  inPhonePreview: boolean
  setPreview: (preview: DevicePreviewId) => void
}

const DevicePreviewContext = createContext<DevicePreviewContextValue | null>(null)

export { DevicePreviewContext }

export function DevicePreviewProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const { mode, canSwitch, setMode } = useWorkMode()
  const navigate = useNavigate()
  const viewportMobile = useViewportMobile()
  const storedUser = getStoredUser()
  const identity = user ?? storedUser

  const [preview, setPreviewState] = useState<DevicePreviewId>(() => {
    if (!identity) return 'desktop'
    return readStoredDevicePreview(identity.id) ?? 'desktop'
  })

  useEffect(() => {
    if (!identity) return
    const stored = readStoredDevicePreview(identity.id)
    if (stored) setPreviewState(stored)
  }, [identity?.id])

  const mobilePreview = isMobilePreviewActive(preview)
  const inPhonePreview = mobilePreview && !viewportMobile

  useEffect(() => {
    const root = document.documentElement
    if (mobilePreview) root.dataset.imesMobilePreview = 'true'
    else delete root.dataset.imesMobilePreview
    return () => {
      delete root.dataset.imesMobilePreview
    }
  }, [mobilePreview])

  const setPreview = useCallback(
    (next: DevicePreviewId) => {
      if (!identity) return
      setPreviewState(next)
      saveDevicePreview(identity.id, next)

      if (next === 'desktop' && typeof window !== 'undefined' && window.parent !== window) {
        window.parent.location.reload()
        return
      }

      if (next === 'desktop' && typeof window !== 'undefined' && window.parent === window) {
        navigate(resolveDefaultLandingPath(mode, identity.id))
        return
      }

      if (next === 'mobile') {
        if (canSwitch && mode === 'management') {
          setMode('operations', { navigate: false })
        }
        if (typeof window === 'undefined' || window.parent === window) {
          navigate(MOBILE_OPS_HOME)
        }
        return
      }
    },
    [identity, canSwitch, mode, setMode, navigate],
  )

  const value = useMemo(
    () => ({
      preview,
      mobilePreview,
      inPhonePreview,
      setPreview,
    }),
    [preview, mobilePreview, inPhonePreview, setPreview],
  )

  return <DevicePreviewContext.Provider value={value}>{children}</DevicePreviewContext.Provider>
}

export function useDevicePreview() {
  const ctx = useContext(DevicePreviewContext)
  if (!ctx) throw new Error('useDevicePreview must be used within DevicePreviewProvider')
  return ctx
}
