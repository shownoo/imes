import { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useQuery, useMutation } from '@apollo/client'
import {
  FormPage,
  FormSection,
  FormStack,
  InsetFormGroup,
  InsetFormRow,
  insetFormInputClass,
  insetFormSelectTriggerClass,
} from 'components/form-page'
import { FormProcessButtons } from 'components/form-process-buttons'
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
      mode={isEdit ? 'edit' : 'create'}
      backTo="/warehouses?tab=shelf"
      backLabel='货位'
      footer={
        <FormProcessButtons
          onCancel={() => navigate('/warehouses?tab=shelf')}
          onSubmit={handleSave}
          loading={saving}
          submitTitle="保存"
        />
      }
    >
      <FormStack>
        <FormSection title="货位信息" desc="编码、库区、位置与容量" inset>
          <InsetFormGroup>
            <InsetFormRow label='货位编码' required>
              <Input className={insetFormInputClass} value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
            </InsetFormRow>
            <InsetFormRow label='货位名称' required>
              <Input className={insetFormInputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </InsetFormRow>
            <InsetFormRow label='所属库区' required>
              <Select value={form.warehouseId} onValueChange={(v) => setForm({ ...form, warehouseId: v })}>
                <SelectTrigger className={insetFormSelectTriggerClass}><SelectValue /></SelectTrigger>
                <SelectContent>{warehouses.map((w) => <SelectItem key={String(w.id)} value={String(w.id)}>{String(w.name)}</SelectItem>)}</SelectContent>
              </Select>
            </InsetFormRow>
            <InsetFormRow label='区域'>
              <Input className={insetFormInputClass} value={form.zone} onChange={(e) => setForm({ ...form, zone: e.target.value })} />
            </InsetFormRow>
            <InsetFormRow label='排'>
              <Input className={insetFormInputClass} value={form.row} onChange={(e) => setForm({ ...form, row: e.target.value })} />
            </InsetFormRow>
            <InsetFormRow label='层'>
              <Input type="number" className={insetFormInputClass} value={String(form.level)} onChange={(e) => setForm({ ...form, level: Number(e.target.value) })} />
            </InsetFormRow>
            <InsetFormRow label='容量'>
              <Input type="number" className={insetFormInputClass} value={String(form.capacity)} onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })} />
            </InsetFormRow>
          </InsetFormGroup>
        </FormSection>
      </FormStack>
    </FormPage>
  )
}
