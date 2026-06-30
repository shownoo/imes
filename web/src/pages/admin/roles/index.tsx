import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@apollo/client'
import { Plus } from 'lucide-react'
import { DataTable, RowActions, Badge, Button } from 'components/common'
import { ListToolbar } from 'components/section-menu'
import { useAuth } from 'lib/auth'
import { GET_ROLES, DELETE_ROLE } from '../queries'

export default function RolesIndex() {
  const navigate = useNavigate()
  const { hasPermission } = useAuth()
  const canWrite = hasPermission('system:role:write')

  const { data, loading, refetch } = useQuery(GET_ROLES)
  const [delRole] = useMutation(DELETE_ROLE, { onCompleted: () => refetch() })

  const roles = (data?.getRoles as { roles: Array<Record<string, unknown>> })?.roles ?? []

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`确认删除角色「${name}」？`)) return
    try {
      await delRole({ variables: { input: { id } } })
    } catch (e) {
      alert(e instanceof Error ? e.message : '删除失败')
    }
  }

  return (
    <div>
      <ListToolbar
        className="mb-4"
        action={canWrite ? (
          <Button onClick={() => navigate('/admin/roles/create')}>
            <Plus className="size-4" /> 新增角色
          </Button>
        ) : undefined}
      />

      <DataTable
        loading={loading}
        columns={[
          { key: 'code', title: '编码' },
          { key: 'name', title: '名称' },
          { key: 'description', title: '说明', render: (r) => String(r.description ?? '—') },
          {
            key: 'system',
            title: '类型',
            render: (r) => (
              <Badge variant={r.system ? 'default' : 'outline'}>
                {r.system ? '内置' : '自定义'}
              </Badge>
            ),
          },
          {
            key: 'permissions',
            title: '权限数',
            render: (r) => {
              const perms = r.permissions as unknown[]
              if (String(r.code) === 'ADMIN') return '全部'
              return String(perms?.length ?? 0)
            },
          },
          { key: 'userCount', title: '用户数' },
          {
            key: 'action',
            title: '操作',
            render: (r) => (
              <RowActions
                onEdit={() => navigate(`/admin/roles/${String(r.id)}/edit`)}
                onDelete={
                  canWrite && !r.system
                    ? () => handleDelete(String(r.id), String(r.name))
                    : undefined
                }
              />
            ),
          },
        ]}
        rows={roles}
      />
    </div>
  )
}
