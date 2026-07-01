import * as React from 'react'
import type { Column, HeaderContext, Table } from '@tanstack/react-table'

export type ColumnLabelMeta = {
  displayName?: string
  label?: string
}

export function reactNodeToLabel(node: React.ReactNode): string | undefined {
  if (node == null || node === false) return undefined
  if (typeof node === 'string' || typeof node === 'number') {
    const text = String(node).trim()
    return text || undefined
  }
  if (typeof node === 'function') {
    try {
      return reactNodeToLabel((node as () => React.ReactNode)())
    } catch {
      return undefined
    }
  }
  if (Array.isArray(node)) {
    const parts = node
      .map(reactNodeToLabel)
      .filter((part): part is string => Boolean(part))
    return parts.length ? parts.join('') : undefined
  }
  if (React.isValidElement(node)) {
    const props = node.props as {
      children?: React.ReactNode
      title?: string
      'aria-label'?: string
    }
    if (props['aria-label']) return props['aria-label'].trim() || undefined
    if (typeof props.title === 'string' && props.title.trim()) {
      return props.title.trim()
    }
    return reactNodeToLabel(props.children)
  }
  return undefined
}

function renderHeaderLabel<TData>(
  column: Column<TData, unknown>,
  table?: Table<TData>,
): string | undefined {
  const header = column.columnDef.header
  if (typeof header === 'string' || typeof header === 'number') {
    return String(header)
  }
  if (typeof header !== 'function') return undefined

  try {
    let ctx: HeaderContext<TData, unknown> | undefined
    if (table) {
      for (const group of table.getHeaderGroups()) {
        const headerCell = group.headers.find((h) => h.column.id === column.id)
        if (headerCell) {
          ctx = headerCell.getContext()
          break
        }
      }
    }
    const rendered = ctx
      ? header(ctx)
      : header({ column } as HeaderContext<TData, unknown>)
    return reactNodeToLabel(rendered)
  } catch {
    return undefined
  }
}

export function getColumnHeaderLabel<TData>(
  column: Column<TData, unknown>,
  table?: Table<TData>,
): string {
  const meta = column.columnDef.meta as ColumnLabelMeta | undefined
  if (meta?.displayName) return String(meta.displayName)
  if (meta?.label) return String(meta.label)

  const fromHeader = renderHeaderLabel(column, table)
  if (fromHeader) return fromHeader

  return column.id
}
