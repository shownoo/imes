import { useEffect, useState } from 'react'

const DEFAULT_POLL_MS = 15_000

/** 页面可见时自动轮询，隐藏时暂停；配合 Apollo pollInterval 实现类订阅的实时同步 */
export function useLiveQueryOptions(pollMs = DEFAULT_POLL_MS) {
  const [visible, setVisible] = useState(
    () => typeof document === 'undefined' || document.visibilityState === 'visible',
  )

  useEffect(() => {
    const onVisibility = () => setVisible(document.visibilityState === 'visible')
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [])

  return {
    pollInterval: visible ? pollMs : 0,
    notifyOnNetworkStatusChange: true,
    refetchOnWindowFocus: true,
  } as const
}
