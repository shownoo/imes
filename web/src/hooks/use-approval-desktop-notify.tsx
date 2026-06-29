import { useEffect, useRef, useState } from 'react'
import { useQuery } from '@apollo/client'
import { GET_INBOX } from 'pages/tasks/queries'
import type { ApprovalInboxItem } from 'lib/approval-flow'

const STORAGE_KEY = 'imes-desktop-notify'
const SEEN_KEY = 'imes-desktop-notify-seen'

export function isDesktopNotifyEnabled() {
  return localStorage.getItem(STORAGE_KEY) === '1'
}

export function setDesktopNotifyEnabled(enabled: boolean) {
  localStorage.setItem(STORAGE_KEY, enabled ? '1' : '0')
  if (!enabled) localStorage.removeItem(SEEN_KEY)
}

function loadSeenIds(): Set<string> {
  try {
    const raw = localStorage.getItem(SEEN_KEY)
    return new Set(raw ? (JSON.parse(raw) as string[]) : [])
  } catch {
    return new Set()
  }
}

function saveSeenIds(ids: Set<string>) {
  localStorage.setItem(SEEN_KEY, JSON.stringify([...ids].slice(-200)))
}

export async function requestDesktopNotifyPermission() {
  if (!('Notification' in window)) {
    throw new Error('当前浏览器不支持桌面通知')
  }
  if (Notification.permission === 'granted') return true
  if (Notification.permission === 'denied') {
    throw new Error('桌面通知已被浏览器拒绝，请在浏览器设置中允许')
  }
  const result = await Notification.requestPermission()
  return result === 'granted'
}

export function useApprovalDesktopNotify() {
  const seenRef = useRef(loadSeenIds())
  const { data } = useQuery(GET_INBOX, {
    pollInterval: 30_000,
    skip: !isDesktopNotifyEnabled() || !('Notification' in window) || Notification.permission !== 'granted',
  })

  useEffect(() => {
    if (!isDesktopNotifyEnabled()) return
    if (!('Notification' in window) || Notification.permission !== 'granted') return

    const tasks = (data?.getMyPendingApprovalTasks ?? []) as ApprovalInboxItem[]
    for (const task of tasks) {
      if (seenRef.current.has(task.taskId)) continue
      seenRef.current.add(task.taskId)
      saveSeenIds(seenRef.current)

      const n = new Notification(`IMES · ${task.bizLabel}待审批`, {
        body: `${task.orderNo} · ${task.nodeLabel ?? '审批'} · ${task.summary}`,
        tag: task.taskId,
        requireInteraction: false,
      })
      n.onclick = () => {
        window.focus()
        window.location.href = task.docPath
        n.close()
      }
    }
  }, [data])
}

export function DesktopNotifyToggle() {
  const [enabled, setEnabled] = useState(isDesktopNotifyEnabled())

  const toggle = async () => {
    if (!enabled) {
      try {
        await requestDesktopNotifyPermission()
        setDesktopNotifyEnabled(true)
        setEnabled(true)
      } catch (e) {
        alert(e instanceof Error ? e.message : '无法开启桌面通知')
      }
    } else {
      setDesktopNotifyEnabled(false)
      setEnabled(false)
    }
  }

  return (
    <button type="button" onClick={toggle} className="text-xs text-primary hover:underline">
      {enabled ? '关闭桌面通知' : '开启桌面通知'}
    </button>
  )
}
