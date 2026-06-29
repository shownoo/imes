import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@apollo/client'
import { Plus, Search } from 'lucide-react'
import { DataTable, RowActions, Badge, Button } from 'components/common'
import { DebounceInput } from 'components/debounce-input'
import { ListToolbar, SearchInputShell } from 'components/section-menu'
import { useAuth } from 'lib/auth'
import { ROLE_LABELS } from 'lib/auth'
import { GET_USERS, SET_USER_ACTIVE } from '../queries'

export default function UsersIndex() {
  const navigate = useNavigate()
  const { hasPermission } = useAuth()
  const canWrite = hasPermission('system:user:write')
  const [search, setSearch] = useState('')

  const { data, loading, error, refetch } = useQuery(GET_USERS, {
    variables: { input: { search: search || undefined, take: 100 } },
    fetchPolicy: 'cache-and-network',
  })
  const [setActive] = useMutation(SET_USER_ACTIVE, { onCompleted: () => refetch() })

  const users = (data?.getUsers as { users: Array<Record<string, unknown>> })?.users ?? []

  const toggleActive = async (id: string, active: boolean) => {
    const label = active ? '启用' : '停用'
    if (!confirm(`确认${label}该用户？`)) return
    try {
      await setActive({ variables: { input: { id, active } } })
    } catch (e) {
      alert(e instanceof Error ? e.message : `${label}失败`)
    }
  }

  return (
    <div>
      <ListToolbar
        search={
          <SearchInputShell>
            <Search className="absolute left-3 top-1/2 z-10 size-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <DebounceInput
              className="pl-9"
              placeholder="搜索用户名、姓名、手机..."
              defaultValue={search}
              debounceTime={500}
              onSearch={setSearch}
            />
          </SearchInputShell>
        }
        action={canWrite ? (
          <Button onClick={() => navigate('/admin/users/create')}>
            <Plus className="size-4" /> 新增账号
          </Button>
        ) : undefined}
      />

      {error && (
        <div className="mb-4 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          加载用户列表失败：{error.message}。请尝试重新登录。
        </div>
      )}

      <DataTable
        loading={loading}
        columns={[
          { key: 'username', title: '用户名' },
          { key: 'name', title: '姓名', render: (r) => String(r.name ?? '—') },
          { key: 'phone', title: '手机', render: (r) => String(r.phone ?? '—') },
          {
            key: 'role',
            title: '角色',
            render: (r) => (
              <Badge variant="secondary">
                {String(r.roleName ?? ROLE_LABELS[String(r.role)] ?? r.role)}
              </Badge>
            ),
          },
          {
            key: 'active',
            title: '状态',
            render: (r) => (
              <Badge variant={r.active ? 'default' : 'outline'}>
                {r.active ? '正常' : '已停用'}
              </Badge>
            ),
          },
          {
            key: 'action',
            title: '操作',
            render: (r) => canWrite ? (
              <RowActions
                onEdit={() => navigate(`/admin/users/${String(r.id)}/edit`)}
                onDelete={r.active ? () => toggleActive(String(r.id), false) : undefined}
              />
            ) : '—',
          },
        ]}
        rows={users}
      />
    </div>
  )
}
