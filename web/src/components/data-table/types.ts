import type { VisibilityState } from '@tanstack/react-table'

export interface FilterOption {
  label: string
  value: string
}

export interface DataTableFilterConfig {
  columnKey: string
  title: string
  options: FilterOption[]
  multiple?: boolean
}

export type { VisibilityState }
