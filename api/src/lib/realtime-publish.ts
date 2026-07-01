import type { Context } from '../context.js'
import {
  OPS_TODO_CHANNEL,
  type DocumentScope,
  type DocumentRealtimePayload,
  type OpsTodoRealtimePayload,
  documentChannel,
  publishRealtime,
} from './realtime-bus.js'

export async function publishDocumentUpdated(
  ctx: Context,
  scope: DocumentScope,
  documentId: string,
  action: string,
) {
  const at = new Date().toISOString()
  const docPayload: DocumentRealtimePayload = {
    scope,
    documentId,
    action,
    at,
    actorId: ctx.identity?.userId,
    actorName: ctx.identity?.name ?? ctx.identity?.username ?? null,
  }
  const opsPayload: OpsTodoRealtimePayload = { scope, documentId, action, at }

  await Promise.all([
    publishRealtime(documentChannel(scope, documentId), docPayload),
    publishRealtime(OPS_TODO_CHANNEL, opsPayload),
  ])
}
