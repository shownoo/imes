/** GraphQL endpoint → API origin（用于 /files/upload 等 REST） */
export function getApiBaseUrl(): string {
  const graphqlUrl = import.meta.env.VITE_API_URL || ''
  if (!graphqlUrl) return ''
  return graphqlUrl.replace(/\/graphql\/?$/i, '')
}
