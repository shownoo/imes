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
import { MaterialLinesEditor } from 'components/material-lines-editor'
import { Input } from 'components/ui/input'
import { CREATE, UPDATE, GET_ORDER, GET_MATERIALS, emptyOutboundForm, type OutboundLineRow } from './queries'

export default function OutboundForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)
  const [form, setForm] = useState(emptyOutboundForm())

  const { data: orderData } = useQuery(GET_ORDER, { skip: !id, variables: { input: { id } } })
  const { data: matData } = useQuery(GET_MATERIALS, { variables: { input: { take: 200 } } })
  const [createOrder, { loading: creating }] = useMutation(CREATE, { refetchQueries: ['GetOutboundOrders'] })
  const [updateOrder, { loading: updating }] = useMutation(UPDATE, { refetchQueries: ['GetOutboundOrders'] })

  const materials = (matData?.getMaterials as { materials: Array<Record<string, unknown>> })?.materials ?? []
  const order = orderData?.getOutboundOrder as Record<string, unknown> | undefined

  useEffect(() => {
    if (order && isEdit) {
      const rowLines = (order.lines as Array<Record<string, unknown>>) ?? []
      setForm({
        purpose: String(order.purpose ?? ''),
        destination: String(order.destination ?? ''),
        recipient: String(order.recipient ?? ''),
        lines: rowLines.length
          ? rowLines.map((l) => ({ materialId: String(l.materialId), requestedQty: Number(l.requestedQty) }))
          : [{ materialId: '', requestedQty: 1 }],
      })
    }
  }, [order, isEdit])

  const handleSave = async () => {
    if (!form.lines.some((l) => l.materialId && l.requestedQty > 0)) {
      alert('请添加出库明细')
      return
    }
    const payload = {
      purpose: form.purpose || undefined,
      destination: form.destination || undefined,
      recipient: form.recipient || undefined,
      lines: form.lines.filter((l) => l.materialId),
    }
    try {
      if (isEdit) {
        await updateOrder({ variables: { input: { id, ...payload } } })
        navigate(`/outbound/${id}`)
      } else {
        const result = await createOrder({ variables: { input: payload } })
        const created = result.data?.createOutboundOrder as { id?: string }
        navigate(created?.id ? `/outbound/${created.id}` : '/outbound')
      }
    } catch (e) {
      alert(e instanceof Error ? e.message : '保存失败')
    }
  }

  const setLines = (lines: OutboundLineRow[]) => setForm({ ...form, lines })

  return (
    <FormPage
      mode={isEdit ? 'edit' : 'create'}
      backTo={isEdit ? `/outbound/${id}` : '/outbound'}
      backLabel='出库管理'
      wide
      footer={
        <FormProcessButtons
          onCancel={() => navigate(isEdit ? `/outbound/${id}` : '/outbound')}
          onSubmit={handleSave}
          loading={creating || updating}
        />
      }
    >
      <FormStack>
        <FormSection title="出库信息" desc="用途、目的地与领用人" inset narrow>
          <InsetFormGroup>
            <InsetFormRow label="用途">
              <Input
                className={insetFormInputClass}
                value={form.purpose}
                onChange={(e) => setForm({ ...form, purpose: e.target.value })}
                placeholder="防汛抢险 / 救灾调拨"
              />
            </InsetFormRow>
            <InsetFormRow label="目的地">
              <Input
                className={insetFormInputClass}
                value={form.destination}
                onChange={(e) => setForm({ ...form, destination: e.target.value })}
                placeholder="接收区域"
              />
            </InsetFormRow>
            <InsetFormRow label="领用人">
              <Input
                className={insetFormInputClass}
                value={form.recipient}
                onChange={(e) => setForm({ ...form, recipient: e.target.value })}
                placeholder="接收单位/联系人"
              />
            </InsetFormRow>
          </InsetFormGroup>
        </FormSection>

        <FormSection title="出库明细" desc="选择物资并填写申请数量">
          <MaterialLinesEditor
            lines={form.lines.map((l) => ({ materialId: l.materialId, quantity: l.requestedQty }))}
            materials={materials}
            onChange={(next) => setLines(next.map((l) => ({ materialId: l.materialId, requestedQty: l.quantity })))}
            onAddLine={() => setLines([...form.lines, { materialId: '', requestedQty: 1 }])}
            quantityLabel="申请数量"
          />
        </FormSection>
      </FormStack>
    </FormPage>
  )
}
