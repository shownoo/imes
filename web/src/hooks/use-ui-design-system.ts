import { useMemo } from 'react'
import { useWorkspace } from 'contexts/workspace-context'
import {
  getDesignSystem,
  readStoredDesignSystemId,
  inferCatalogSelection,
  type UiDesignSystemId,
} from 'lib/ui-design-catalog'
import { getDesignSystemFeatures, type UiDesignSystemFeatures } from 'lib/ui-design-tokens'

export function useUiDesignSystem(): {
  id: UiDesignSystemId
  name: string
  features: UiDesignSystemFeatures
} {
  const { theme, variant } = useWorkspace()
  return useMemo(() => {
    const id =
      readStoredDesignSystemId() ?? inferCatalogSelection(theme.id, variant).designSystemId
    const ds = getDesignSystem(id)
    return { id, name: ds.name, features: getDesignSystemFeatures(id) }
  }, [theme.id, variant])
}
