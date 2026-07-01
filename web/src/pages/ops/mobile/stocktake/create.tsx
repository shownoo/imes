import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery } from '@apollo/client'
import { MobileOpsCrumbBar } from 'components/mobile-ops-crumb-bar'
import { Button } from 'components/common'
import { GET_WAREHOUSES, GET_SHELVES } from 'pages/warehouses/queries'
import { CREATE_STOCKTAKE_TASK } from '../queries'
import { MOBILE_OPS_TOOLS_STOCKTAKE } from 'lib/mobile-ops'
import { useTranslation } from 'react-i18next'

export default function OpsStocktakeCreate() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [warehouseId, setWarehouseId] = useState('')
  const [shelfId, setShelfId] = useState('')
  const [zone, setZone] = useState('')
  const [title, setTitle] = useState('')
  const [error, setError] = useState('')

  const { data: whData } = useQuery(GET_WAREHOUSES)
  const { data: shelfData } = useQuery(GET_SHELVES, {
    variables: { warehouseId: warehouseId || undefined, input: { take: 200, skip: 0 } },
    skip: !warehouseId,
  })

  const warehouses =
    (whData?.getWarehouses as { warehouses: Array<{ id: string; name: string }> })?.warehouses ?? []
  const shelves =
    (shelfData?.getShelves as { shelves: Array<{ id: string; code: string; name: string; zone: string }> })
      ?.shelves ?? []

  const zones = [...new Set(shelves.map((s) => s.zone).filter(Boolean))]

  const [createTask, { loading }] = useMutation(CREATE_STOCKTAKE_TASK, {
    onCompleted: (res) => {
      const task = res.createStocktakeTask as { id: string }
      navigate(`/ops/stocktake/${task.id}`, { replace: true })
    },
    onError: (e) => setError(e.message),
  })

  const submit = () => {
    setError('')
    createTask({
      variables: {
        warehouseId: warehouseId || undefined,
        shelfId: shelfId || undefined,
        zone: zone || undefined,
        title: title.trim() || undefined,
      },
    })
  }

  return (
    <div className="mobile-ops-page">
      <MobileOpsCrumbBar
        title={t('新建盘点')}
        onBack={() => navigate(MOBILE_OPS_TOOLS_STOCKTAKE)}
        backLabel={t('盘点任务')}
      />
      <div className="mobile-ops-page-body space-y-4">
        <section className="mobile-ops-card space-y-3">
          <label className="block text-sm">
            <span className="mb-1.5 block text-xs text-muted-foreground">{t('库区（可选）')}</span>
            <select
              className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm"
              value={warehouseId}
              onChange={(e) => {
                setWarehouseId(e.target.value)
                setShelfId('')
                setZone('')
              }}
            >
              <option value="">{t('全场盘点')}</option>
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          </label>

          {warehouseId && (
            <label className="block text-sm">
              <span className="mb-1.5 block text-xs text-muted-foreground">{t('货位（可选，精确到货架）')}</span>
              <select
                className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm"
                value={shelfId}
                onChange={(e) => {
                  setShelfId(e.target.value)
                  if (e.target.value) setZone('')
                }}
              >
                <option value="">{t('按库区/分区盘点')}</option>
                {shelves.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.code} · {s.name}
                  </option>
                ))}
              </select>
            </label>
          )}

          {warehouseId && !shelfId && zones.length > 0 && (
            <label className="block text-sm">
              <span className="mb-1.5 block text-xs text-muted-foreground">{t('分区（可选）')}</span>
              <select
                className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm"
                value={zone}
                onChange={(e) => setZone(e.target.value)}
              >
                <option value="">{t('全库区')}</option>
                {zones.map((z) => (
                  <option key={z} value={z}>
                    {z}
                  </option>
                ))}
              </select>
            </label>
          )}

          <label className="block text-sm">
            <span className="mb-1.5 block text-xs text-muted-foreground">{t('任务名称（可选）')}</span>
            <input
              className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('留空则自动生成')}
            />
          </label>
        </section>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button className="h-11 w-full" disabled={loading} onClick={submit}>
          {loading ? '创建中…' : '创建并开始盘点'}
        </Button>
      </div>
    </div>
  )
}
