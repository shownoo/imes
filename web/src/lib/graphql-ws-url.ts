/** 将 HTTP GraphQL 地址转为 WS；开发环境走 Vite 同源代理 */
export function resolveGraphqlWsUrl(): string {
  const apiUrl = import.meta.env.VITE_API_URL as string | undefined
  if (apiUrl) {
    return apiUrl.replace(/^http/i, 'ws')
  }
  const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  return `${proto}//${window.location.host}/graphql`
}
