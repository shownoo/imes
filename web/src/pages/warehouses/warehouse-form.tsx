import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
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
import { GET_WAREHOUSES, ADD_WAREHOUSE, ZONE_OPTIONS } from './queries'

export default function WarehouseForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)
  const [form, setForm] = useState({ code: '', name: '', zone: 'GENERAL', area: '' as number | '', capacity: '' as number | '' })

  const { data: whData, loading } = useQuery(GET_WAREHOUSES)
  const [save, { loading: saving }] = useMutation(ADD_WAREHOUSE, { refetchQueries: ['GetWarehouses'] })

  const warehouses = (whData?.getWarehouses as { warehouses: Array<Record<string, unknown>> })?.warehouses ?? []
  const record = isEdit ? warehouses.find((w) => String(w.id) === id) : undefined

  useEffect(() => {
    if (record) {
      setForm({
        code: String(record.code),
        name: String(record.name),
        zone: String(record.zone),
        area: record.area != null ? Number(record.area) : '',
        capacity: record.capacity != null ? Number(record.capacity) : '',
      })
    }
  }, [record])

  const handleSave = async () => {
    try {
      await save({
        variables: {
          input: {
            id: id || undefined,
            code: form.code,
            name: form.name,
            zone: form.zone,
            area: form.area !== '' ? Number(form.area) : undefined,
            capacity: form.capacity !== '' ? Number(form.capacity) : undefined,
          },
        },
      })
      navigate('/warehouses?tab=warehouse')
    } catch (e) {
      alert(e instanceof Error ? e.message : '保存失败')
    }
  }

  if (isEdit && loading) return null

  return (
    <FormPage
      mode={isEdit ? 'edit' : 'create'}
      backTo="/warehouses?tab=warehouse"
      backLabel='仓库'
      footer={
        <FormProcessButtons
          onCancel={() => navigate('/warehouses?tab=warehouse')}
          onSubmit={handleSave}
          loading={saving}
          submitTitle="保存"
        />
      }
    >
      <FormStack>
        <FormSection title="仓库信息" desc="编码、名称、类型与容量" inset>
          <InsetFormGroup>
            <InsetFormRow label='仓库编码' required>
              <Input
                className={insetFormInputClass}
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
              />
            </InsetFormRow>
            <InsetFormRow label='仓库名称' required>
              <Input
                className={insetFormInputClass}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </InsetFormRow>
            <InsetFormRow label='库房类型'>
              <Select value={form.zone} onValueChange={(v) => setForm({ ...form, zone: v })}>
                <SelectTrigger className={insetFormSelectTriggerClass}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ZONE_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </InsetFormRow>
            <InsetFormRow label='面积(m²)'>
              <Input
                type="number"
                className={insetFormInputClass}
                value={String(form.area)}
                onChange={(e) => setForm({ ...form, area: e.target.value === '' ? '' : Number(e.target.value) })}
              />
            </InsetFormRow>
            <InsetFormRow label='容量'>
              <Input
                type="number"
                className={insetFormInputClass}
                value={String(form.capacity)}
                onChange={(e) => setForm({ ...form, capacity: e.target.value === '' ? '' : Number(e.target.value) })}
              />
            </InsetFormRow>
          </InsetFormGroup>
        </FormSection>
      </FormStack>
    </FormPage>
  )
}
