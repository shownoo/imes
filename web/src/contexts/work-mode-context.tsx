import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getStoredUser } from 'lib/apollo'
import { useAuth } from 'lib/auth'
import {
  getDefaultLandingPath,
  getDefaultWorkModeFromRole,
  getWorkModePerspective,
  readStoredWorkMode,
  resolveWorkMode,
  saveWorkMode,
  canSwitchWorkMode,
  type WorkModeId,
} from 'lib/work-mode'
import { useWorkspace } from 'contexts/workspace-context'

type WorkModeContextValue = {
  mode: WorkModeId
  canSwitch: boolean
  setMode: (mode: WorkModeId, options?: { navigate?: boolean }) => void
  initForUser: (userId: string, role: string) => WorkModeId
}

const WorkModeContext = createContext<WorkModeContextValue | null>(null)

export function WorkModeProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const { applyPerspective } = useWorkspace()
  const navigate = useNavigate()
  const storedUser = getStoredUser()

  const [mode, setModeState] = useState<WorkModeId>(() => {
    const u = storedUser
    if (!u) return 'management'
    return resolveWorkMode(u)
  })

  const canSwitch = canSwitchWorkMode(user ?? storedUser)

  const applyModeSideEffects = useCallback(
    (next: WorkModeId) => {
      applyPerspective(getWorkModePerspective(next))
    },
    [applyPerspective],
  )

  useEffect(() => {
    if (!user) return
    const resolved = resolveWorkMode(user)
    setModeState(resolved)
    applyModeSideEffects(resolved)
  }, [user?.id, user?.role])

  const setMode = useCallback(
    (next: WorkModeId, options?: { navigate?: boolean }) => {
      const identity = user ?? storedUser
      if (!identity) return
      if (next === 'management' && !canSwitchWorkMode(identity)) return

      setModeState(next)
      saveWorkMode(identity.id, next)
      applyModeSideEffects(next)

      if (options?.navigate !== false) {
        navigate(getDefaultLandingPath(next, identity.id))
      }
    },
    [user, storedUser, applyModeSideEffects, navigate],
  )

  const initForUser = useCallback(
    (userId: string, role: string) => {
      const canSwitch = role === 'ADMIN' || role === 'SUPERVISOR'
      const stored = readStoredWorkMode(userId)
      const next = canSwitch
        ? (stored ?? getDefaultWorkModeFromRole(role))
        : getDefaultWorkModeFromRole(role)
      setModeState(next)
      saveWorkMode(userId, next)
      applyModeSideEffects(next)
      return next
    },
    [applyModeSideEffects],
  )

  const value = useMemo(
    () => ({ mode, canSwitch, setMode, initForUser }),
    [mode, canSwitch, setMode, initForUser],
  )

  return <WorkModeContext.Provider value={value}>{children}</WorkModeContext.Provider>
}

export function useWorkMode() {
  const ctx = useContext(WorkModeContext)
  if (!ctx) throw new Error('useWorkMode must be used within WorkModeProvider')
  return ctx
}
