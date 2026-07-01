import { useEffect, useRef, useState } from 'react'
import { useSubscription } from '@apollo/client'
import { DOCUMENT_UPDATED, type DocumentRealtimeEvent } from 'lib/realtime-queries'
import { getStoredUser } from 'lib/apollo'

export function useDocumentRealtime(
  scope: 'inbound' | 'outbound',
  documentId: string | undefined,
  onRemoteUpdate: () => void,
) {
  const selfId = getStoredUser()?.id
  const [notice, setNotice] = useState<string | null>(null)
  const onRemoteUpdateRef = useRef(onRemoteUpdate)
  onRemoteUpdateRef.current = onRemoteUpdate

  useSubscription(DOCUMENT_UPDATED, {
    variables: { scope, documentId },
    skip: !documentId,
    onData: ({ data }) => {
      const payload = data.data?.documentUpdated as DocumentRealtimeEvent | undefined
      if (!payload) return
      if (payload.actorId && payload.actorId === selfId) return
      const who = payload.actorName?.trim() || '其他同事'
      setNotice(`${who} 更新了当前单据`)
      onRemoteUpdateRef.current()
    },
  })

  useEffect(() => {
    if (!notice) return
    const timer = window.setTimeout(() => setNotice(null), 4500)
    return () => window.clearTimeout(timer)
  }, [notice])

  return { notice, clearNotice: () => setNotice(null) }
}
