import {
  buildEntitySearchIndex,
  filterEntitySearch,
  type EntitySearchItem,
  type EntitySearchSource,
} from 'lib/entity-search'

export type { EntitySearchItem, EntitySearchSource }

export function materialDisplayLabel(m: EntitySearchSource) {
  return `${String(m.code)} · ${String(m.name)}`
}

export function buildMaterialSearchIndex(materials: EntitySearchSource[]): EntitySearchItem[] {
  return buildEntitySearchIndex(materials, materialDisplayLabel)
}

export const filterMaterialsBySearch = filterEntitySearch
