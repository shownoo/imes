import { useEffect } from 'react'
import { useQuery } from '@apollo/client'
import { useNavigate } from 'react-router-dom'
import { clearAuth, getStoredUser, storeAuth, type User } from 'lib/apollo'
import { ME } from 'lib/auth'

/** 启动时校验 token；RBAC 迁移后旧会话会导致 API 鉴权失败 */
export function AuthSession() {
  const navigate = useNavigate()
  const stored = getStoredUser()
  const { data, error, loading } = useQuery(ME, { skip: !stored, fetchPolicy: 'network-only' })

  useEffect(() => {
    if (!stored || loading) return

    const identity = data?.me as User | null | undefined
    if (error || identity === null) {
      clearAuth()
      navigate('/login', { replace: true })
      return
    }

    if (identity) {
      const token = localStorage.getItem('imes_token')
      if (token) storeAuth(token, identity)
    }
  }, [stored, loading, data, error, navigate])

  return null
}
