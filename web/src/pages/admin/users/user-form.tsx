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
import { Button } from 'components/common'
import { FormProcessButtons } from 'components/form-process-buttons'
import { Input } from 'components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from 'components/ui/select'
import { GET_USER, GET_ROLES, ADD_USER, RESET_USER_PASSWORD } from '../queries'

export default function UserForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)
  const [form, setForm] = useState({
    username: '',
    password: '',
    name: '',
    phone: '',
    email: '',
    roleId: '',
    active: true,
  })
  const [newPassword, setNewPassword] = useState('')

  const { data: userData, loading } = useQuery(GET_USER, { skip: !id, variables: { input: { id } } })
  const { data: rolesData } = useQuery(GET_ROLES)
  const [save, { loading: saving }] = useMutation(ADD_USER, { refetchQueries: ['GetUsers'] })
  const [resetPwd, { loading: resetting }] = useMutation(RESET_USER_PASSWORD, { refetchQueries: ['GetUsers'] })

  const roles = (rolesData?.getRoles as { roles: Array<Record<string, unknown>> })?.roles ?? []
  const record = userData?.getUser as Record<string, unknown> | undefined

  useEffect(() => {
    if (record) {
      setForm({
        username: String(record.username ?? ''),
        password: '',
        name: String(record.name ?? ''),
        phone: String(record.phone ?? ''),
        email: String(record.email ?? ''),
        roleId: String(record.roleId ?? ''),
        active: Boolean(record.active ?? true),
      })
    } else if (!isEdit && roles[0]) {
      setForm((f) => ({ ...f, roleId: String(roles[0].id) }))
    }
  }, [record, isEdit, roles])

  const handleSave = async () => {
    try {
      await save({
        variables: {
          input: {
            id: id || undefined,
            username: form.username,
            password: form.password || undefined,
            name: form.name || undefined,
            phone: form.phone || undefined,
            email: form.email || undefined,
            roleId: form.roleId,
            active: form.active,
          },
        },
      })
      navigate('/admin/users')
    } catch (e) {
      alert(e instanceof Error ? e.message : '保存失败')
    }
  }

  const handleResetPassword = async () => {
    if (!id || !newPassword) return
    if (!confirm('确认重置该用户密码？')) return
    try {
      await resetPwd({ variables: { input: { id, password: newPassword } } })
      setNewPassword('')
      alert('密码已重置')
    } catch (e) {
      alert(e instanceof Error ? e.message : '重置失败')
    }
  }

  if (isEdit && loading) return null

  return (
    <FormPage
      mode={isEdit ? 'edit' : 'create'}
      backTo="/admin/users"
      backLabel='账号管理'
      footer={
        <FormProcessButtons
          onCancel={() => navigate('/admin/users')}
          onSubmit={handleSave}
          loading={saving}
          submitTitle="保存"
        />
      }
    >
      <FormStack>
        <FormSection title="账号信息" desc="登录凭据、角色与状态" inset>
          <InsetFormGroup>
            <InsetFormRow label='用户名' required>
              <Input
                className={insetFormInputClass}
                value={form.username}
                disabled={isEdit}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                placeholder='登录用户名'
              />
            </InsetFormRow>
            {!isEdit && (
              <InsetFormRow label='初始密码' required>
                <Input
                  type="password"
                  className={insetFormInputClass}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder='至少 6 位'
                />
              </InsetFormRow>
            )}
            <InsetFormRow label='角色' required>
              <Select value={form.roleId} onValueChange={(v) => setForm({ ...form, roleId: v })}>
                <SelectTrigger className={insetFormSelectTriggerClass}><SelectValue placeholder='选择角色' /></SelectTrigger>
                <SelectContent>
                  {roles.map((r) => (
                    <SelectItem key={String(r.id)} value={String(r.id)}>
                      {String(r.name)} ({String(r.code)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </InsetFormRow>
            <InsetFormRow label='状态'>
              <Select
                value={form.active ? 'true' : 'false'}
                onValueChange={(v) => setForm({ ...form, active: v === 'true' })}
              >
                <SelectTrigger className={insetFormSelectTriggerClass}><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">正常</SelectItem>
                  <SelectItem value="false">停用</SelectItem>
                </SelectContent>
              </Select>
            </InsetFormRow>
            <InsetFormRow label='姓名'>
              <Input className={insetFormInputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </InsetFormRow>
            <InsetFormRow label='手机'>
              <Input className={insetFormInputClass} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </InsetFormRow>
            <InsetFormRow label='邮箱'>
              <Input type="email" className={insetFormInputClass} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder='用于审批邮件通知' />
            </InsetFormRow>
          </InsetFormGroup>
        </FormSection>

        {isEdit && (
          <FormSection title="安全设置" desc="重置后需使用新密码登录" inset>
            <InsetFormGroup>
              <InsetFormRow label='新密码' block>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <Input
                    type="password"
                    className="h-9 max-w-xs"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder='输入新密码'
                  />
                  <Button variant="outline" size="sm" onClick={handleResetPassword} disabled={resetting || !newPassword}>
                    重置密码
                  </Button>
                </div>
              </InsetFormRow>
            </InsetFormGroup>
          </FormSection>
        )}
      </FormStack>
    </FormPage>
  )
}
