import { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useQuery, useMutation } from '@apollo/client'
import { FormPage, FormField, FormGrid } from 'components/form-page'
import { Button } from 'components/common'
import { Input } from 'components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from 'components/ui/select'
import { GET_WAREHOUSES, GET_SHELVES, ADD_SHELF } from './queries'

export default function ShelfForm() {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)
  const [form, setForm] = useState({ code: '', name: '', zone: 'A', row: '1', level: 1, capacity: 500, warehouseId: searchParams.get('warehouseId') ?? '' })

  const { data: whData } = useQuery(GET_WAREHOUSES)
  const { data: shData, loading } = useQuery(GET_SHELVES, { variables: { input: { take: 200 } } })
  const [save, { loading: saving }] = useMutation(ADD_SHELF, { refetchQueries: ['GetShelves'] })

  const warehouses = (whData?.getWarehouses as { warehouses: Array<Record<string, unknown>> })?.warehouses ?? []
  const shelves = (shData?.getShelves as { shelves: Array<Record<string, unknown>> })?.shelves ?? []
  const record = isEdit ? shelves.find((s) => String(s.id) === id) : undefined

  useEffect(() => {
    if (record) {
      setForm({
        code: String(record.code),
        name: String(record.name),
        zone: String(record.zone),
        row: String(record.row ?? ''),
        level: Number(record.level ?? 1),
        capacity: Number(record.capacity ?? 500),
        warehouseId: String((record.warehouse as { id?: string })?.id ?? ''),
      })
    } else if (!isEdit && !form.warehouseId && warehouses[0]) {
      setForm((f) => ({ ...f, warehouseId: String(warehouses[0].id) }))
    }
  }, [record, warehouses, isEdit, form.warehouseId])

  const handleSave = async () => {
    try {
      await save({
        variables: {
          input: {
            id: id || undefined,
            code: form.code,
            name: form.name,
            zone: form.zone,
            row: form.row || undefined,
            level: Number(form.level),
            capacity: Number(form.capacity),
            warehouseId: form.warehouseId,
          },
        },
      })
      navigate('/warehouses?tab=shelf')
    } catch (e) {
      alert(e instanceof Error ? e.message : '保存失败')
    }
  }

  if (isEdit && loading) return null

  return (
    <FormPage
      title={isEdit ? '编辑货位' : '新增货位'}
      backTo="/warehouses?tab=shelf"
      backLabel='货位'
      footer={
        <>
          <Button variant="outline" onClick={() => navigate('/warehouses?tab=shelf')}>取消'</Button>
          <Button onClick={handleSave} disabled={saving}>保存</Button>
        </>
      }
    >
      <FormGrid>
        <FormField label='货位编码' required><Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} /></FormField>
        <FormField label='货位名称' required><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></FormField>
        <FormField label='所属库区' required>
          <Select value={form.warehouseId} onValueChange={(v) => setForm({ ...form, warehouseId: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{warehouses.map((w) => <SelectItem key={String(w.id)} value={String(w.id)}>{String(w.name)}</SelectItem>)}</SelectContent>
          </Select>
        </FormField>
        <FormField label='区域'><Input value={form.zone} onChange={(e) => setForm({ ...form, zone: e.target.value })} /></FormField>
        <FormField label='排'><Input value={form.row} onChange={(e) => setForm({ ...form, row: e.target.value })} /></FormField>
        <FormField label='层'><Input type="number" value={String(form.level)} onChange={(e) => setForm({ ...form, level: Number(e.target.value) })} /></FormField>
        <FormField label='容量'><Input type="number" value={String(form.capacity)} onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })} /></FormField>
      </FormGrid>
    </FormPage>
  )
}
