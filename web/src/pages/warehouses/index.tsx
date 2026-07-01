import { Navigate, useParams, useSearchParams } from 'react-router-dom'

/** 旧 /warehouses 入口重定向到基础数据对应 Tab */
export default function WarehousesIndex() {
  const [params] = useSearchParams()
  const tab = params.get('tab')
  const to = tab === 'shelf' ? '/materials?tab=shelves' : '/materials?tab=warehouses'
  return <Navigate to={to} replace />
}

export function WarehousesLegacyRedirect({ to }: { to: string }) {
  const [params] = useSearchParams()
  const q = params.toString()
  return <Navigate to={q ? `${to}?${q}` : to} replace />
}

export function WarehouseEditLegacyRedirect() {
  const { id } = useParams()
  return <Navigate to={`/materials/warehouse/${id}/edit`} replace />
}

export function ShelfEditLegacyRedirect() {
  const { id } = useParams()
  return <Navigate to={`/materials/shelf/${id}/edit`} replace />
}
