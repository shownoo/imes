import { useCallback, useEffect, useRef, useState } from 'react'
import type {
  ColumnSizingState,
  OnChangeFn,
  Updater,
  VisibilityState,
} from '@tanstack/react-table'

import { useAuth } from 'lib/auth'

import { type ColumnOrderMeta, mergeOrder } from './columnOrderStorage'
import { clampColumnSize, mergeColumnSizes } from './columnSizingStorage'
import { mergeVisibility } from './columnVisibilityStorage'
import {
  type TableColumnPrefsPayload,
  type TableColumnPrefsSettings,
  clearTableColumnPrefs,
  readTableColumnPrefs,
  writeTableColumnPrefs,
} from './tableColumnPrefsStorage'

const SAVE_DEBOUNCE_MS = 300

function applyUpdater<T>(updater: Updater<T>, value: T): T {
  return typeof updater === 'function' ? (updater as (old: T) => T)(value) : updater
}

export interface UsePersistedTableColumnsOptions {
  tableKey?: string
  defaultOrder: string[]
  columnMetas: ColumnOrderMeta[]
  defaultVisibility: VisibilityState
  columnIds: string[]
  defaultSizes: Record<string, number>
  resizableColumnIds: string[]
  orderEnabled?: boolean
  visibilityEnabled?: boolean
  sizingEnabled?: boolean
}

export function usePersistedTableColumns({
  tableKey,
  defaultOrder,
  columnMetas,
  defaultVisibility,
  columnIds,
  defaultSizes,
  resizableColumnIds,
  orderEnabled = true,
  visibilityEnabled = true,
  sizingEnabled = true,
}: UsePersistedTableColumnsOptions) {
  const { user } = useAuth()
  const userId = user?.id ?? 'anonymous'

  const canPersist = Boolean(
    tableKey && userId && (orderEnabled || visibilityEnabled || sizingEnabled),
  )

  const columnIdsKey = columnIds.join('\0')
  const resizableIdsKey = resizableColumnIds.join('\0')
  const defaultVisibilityKey = JSON.stringify(defaultVisibility)

  const [columnOrder, setColumnOrder] = useState<string[]>(defaultOrder)
  const [columnVisibility, setColumnVisibility] =
    useState<VisibilityState>(defaultVisibility)
  const [columnSizing, setColumnSizing] = useState<ColumnSizingState>({})

  const loadedRef = useRef(false)
  const prefsRef = useRef<TableColumnPrefsPayload | null>(null)
  const localSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const scheduleSave = useCallback(() => {
    if (!canPersist || !loadedRef.current || !tableKey) return

    if (localSaveTimerRef.current) clearTimeout(localSaveTimerRef.current)
    localSaveTimerRef.current = setTimeout(() => {
      const partial: Partial<TableColumnPrefsSettings> = {}
      if (orderEnabled) partial.order = columnOrder
      if (visibilityEnabled) {
        const toSave: VisibilityState = {}
        for (const id of columnIds) {
          if (id in columnVisibility) toSave[id] = columnVisibility[id]!
        }
        partial.visibility = toSave
      }
      if (sizingEnabled) {
        const toSave: Record<string, number> = {}
        for (const id of resizableColumnIds) {
          const size = columnSizing[id]
          if (size != null && Number.isFinite(size)) {
            toSave[id] = clampColumnSize(size)
          }
        }
        partial.sizing = toSave
      }
      prefsRef.current = writeTableColumnPrefs(
        userId,
        tableKey,
        partial,
        prefsRef.current,
      )
    }, SAVE_DEBOUNCE_MS)
  }, [
    canPersist,
    tableKey,
    userId,
    orderEnabled,
    visibilityEnabled,
    sizingEnabled,
    columnOrder,
    columnVisibility,
    columnSizing,
    columnIds,
    resizableColumnIds,
  ])

  useEffect(() => {
    loadedRef.current = false
    prefsRef.current = null

    if (!orderEnabled) setColumnOrder(defaultOrder)
    if (!visibilityEnabled) setColumnVisibility(defaultVisibility)
    if (!sizingEnabled) setColumnSizing({})

    if (!canPersist || !tableKey) {
      if (orderEnabled) setColumnOrder(defaultOrder)
      if (visibilityEnabled) setColumnVisibility(defaultVisibility)
      if (sizingEnabled) setColumnSizing({})
      loadedRef.current = true
      return
    }

    const prefs = readTableColumnPrefs(userId, tableKey)
    prefsRef.current = prefs

    if (orderEnabled) {
      setColumnOrder(
        mergeOrder(prefs?.settings.order, defaultOrder, columnIds, columnMetas),
      )
    }
    if (visibilityEnabled) {
      setColumnVisibility(
        mergeVisibility(prefs?.settings.visibility, defaultVisibility, columnIds),
      )
    }
    if (sizingEnabled) {
      setColumnSizing(
        mergeColumnSizes(defaultSizes, prefs?.settings.sizing ?? null, resizableColumnIds),
      )
    }
    loadedRef.current = true
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    canPersist,
    tableKey,
    userId,
    columnIdsKey,
    resizableIdsKey,
    defaultVisibilityKey,
    orderEnabled,
    visibilityEnabled,
    sizingEnabled,
  ])

  useEffect(() => {
    if (!canPersist || !loadedRef.current) return
    scheduleSave()
  }, [columnOrder, columnVisibility, columnSizing, canPersist, scheduleSave])

  useEffect(
    () => () => {
      if (localSaveTimerRef.current) clearTimeout(localSaveTimerRef.current)
    },
    [],
  )

  const onColumnOrderChange: OnChangeFn<string[]> = useCallback((updater) => {
    setColumnOrder((prev) => applyUpdater(updater, prev))
  }, [])

  const onColumnVisibilityChange: OnChangeFn<VisibilityState> = useCallback((updater) => {
    setColumnVisibility((prev) => applyUpdater(updater, prev))
  }, [])

  const onColumnSizingChange: OnChangeFn<ColumnSizingState> = useCallback((updater) => {
    setColumnSizing((prev) => applyUpdater(updater, prev))
  }, [])

  const resetColumnSize = useCallback((columnId: string) => {
    setColumnSizing((prev) => {
      if (!(columnId in prev)) return prev
      const next = { ...prev }
      delete next[columnId]
      return next
    })
  }, [])

  const resetColumnSettings = useCallback(() => {
    setColumnOrder(defaultOrder)
    setColumnVisibility(defaultVisibility)
    setColumnSizing({})

    if (canPersist && tableKey) {
      clearTableColumnPrefs(userId, tableKey)
      prefsRef.current = null
    }
  }, [defaultOrder, defaultVisibility, canPersist, userId, tableKey])

  return {
    columnOrder,
    onColumnOrderChange,
    columnVisibility,
    onColumnVisibilityChange,
    columnSizing,
    onColumnSizingChange,
    resetColumnSize,
    resetColumnSettings,
    canPersist,
  }
}
