import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@apollo/client'
import { gql } from '@apollo/client'
import { Shield, Loader2 } from 'lucide-react'
import { Button } from 'components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from 'components/ui/card'
import { Input } from 'components/ui/input'
import { Label } from 'components/ui/label'
import { storeAuth, type User } from 'lib/apollo'

const LOGIN = gql`mutation Login($input: LoginInput!) { login(input: $input) }`

export default function Login() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('admin')
  const [password, setPassword] = useState('123456')
  const [error, setError] = useState('')
  const [login, { loading }] = useMutation(LOGIN)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      const { data } = await login({ variables: { input: { username, password } } })
      const result = data.login as { token: string; user: User }
      storeAuth(result.token, result.user)
      navigate('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : '登录失败')
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-primary">
            <Shield className="size-7 text-primary-foreground" />
          </div>
          <h1 className="font-display text-2xl font-bold">应急物资智能管理系统</h1>
          <p className="mt-1 text-sm text-muted-foreground">应急物资智能管理系统 · IMES</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>登录</CardTitle>
            <CardDescription>演示账号 admin / 123456</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">用户名</Label>
                <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">密码</Label>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="size-4 animate-spin" />}
                登录</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
