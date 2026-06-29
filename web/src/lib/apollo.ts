import { ApolloClient, InMemoryCache, createHttpLink, from } from '@apollo/client'
import { setContext } from '@apollo/client/link/context'
import { onError } from '@apollo/client/link/error'

const httpLink = createHttpLink({
  uri: import.meta.env.VITE_API_URL || '/graphql',
})

const authLink = setContext((_, { headers }) => {
  const token = localStorage.getItem('imes_token')
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
    },
  }
})

export function clearAuth() {
  localStorage.removeItem('imes_token')
  localStorage.removeItem('imes_user')
}

const errorLink = onError(({ graphQLErrors }) => {
  const unauthorized = graphQLErrors?.some(
    (e) => e.message === 'Unauthorized' || e.extensions?.code === 'UNAUTHENTICATED',
  )
  if (unauthorized && localStorage.getItem('imes_token')) {
    clearAuth()
    if (window.location.pathname !== '/login') {
      window.location.assign('/login')
    }
  }
})

export const client = new ApolloClient({
  link: from([errorLink, authLink.concat(httpLink)]),
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: { fetchPolicy: 'cache-and-network' },
  },
})

export interface User {
  id: string
  username: string
  name: string | null
  role: string
  roleId?: string
  roleName?: string
  permissions?: string[]
  phone?: string | null
  active?: boolean
}

export function getStoredUser(): User | null {
  const raw = localStorage.getItem('imes_user')
  return raw ? JSON.parse(raw) : null
}

export function storeAuth(token: string, user: User) {
  localStorage.setItem('imes_token', token)
  localStorage.setItem('imes_user', JSON.stringify(user))
}
