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
} from 'components/form-page'
import { FormProcessButtons } from 'components/form-process-buttons'
import { Input } from 'components/ui/input'
import { GET_SUPPLIERS, ADD_SUPPLIER } from './queries'

export default function SupplierForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)
  const [form, setForm] = useState({ code: '', name: '', contact: '', phone: '', address: '', license: '' })

  const { data: supData, loading } = useQuery(GET_SUPPLIERS, { variables: { input: { take: 100 } } })
  const [save, { loading: saving }] = useMutation(ADD_SUPPLIER, { refetchQueries: ['GetSuppliers'] })

  const suppliers = (supData?.getSuppliers as { suppliers: Array<Record<string, unknown>> })?.suppliers ?? []
  const record = isEdit ? suppliers.find((s) => String(s.id) === id) : undefined

  useEffect(() => {
    if (record) {
      setForm({
        code: String(record.code),
        name: String(record.name),
        contact: String(record.contact ?? ''),
        phone: String(record.phone ?? ''),
        address: String(record.address ?? ''),
        license: String(record.license ?? ''),
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
            contact: form.contact || undefined,
            phone: form.phone || undefined,
            address: form.address || undefined,
            license: form.license || undefined,
          },
        },
      })
      navigate('/materials?tab=suppliers')
    } catch (e) {
      alert(e instanceof Error ? e.message : '保存失败')
    }
  }

  if (isEdit && loading) return null

  return (
    <FormPage
      mode={isEdit ? 'edit' : 'create'}
      backTo="/materials?tab=suppliers"
      backLabel='供应商'
      footer={
        <FormProcessButtons
          onCancel={() => navigate('/materials?tab=suppliers')}
          onSubmit={handleSave}
          loading={saving}
          submitTitle="保存"
        />
      }
    >
      <FormStack>
        <FormSection title="供应商信息" desc="编码、联系方式与资质" inset>
          <InsetFormGroup>
            <InsetFormRow label='供应商编码' required>
              <Input className={insetFormInputClass} value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
            </InsetFormRow>
            <InsetFormRow label='供应商名称' required>
              <Input className={insetFormInputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </InsetFormRow>
            <InsetFormRow label='联系人'>
              <Input className={insetFormInputClass} value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} />
            </InsetFormRow>
            <InsetFormRow label='联系电话'>
              <Input className={insetFormInputClass} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </InsetFormRow>
            <InsetFormRow label='地址'>
              <Input className={insetFormInputClass} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </InsetFormRow>
            <InsetFormRow label='资质证照'>
              <Input className={insetFormInputClass} value={form.license} onChange={(e) => setForm({ ...form, license: e.target.value })} />
            </InsetFormRow>
          </InsetFormGroup>
        </FormSection>
      </FormStack>
    </FormPage>
  )
}
