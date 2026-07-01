import { builder } from '../builder.js'
import { OPS_TODO_CHANNEL, documentChannel, subscribeRealtime } from '../lib/realtime-bus.js'

builder.subscriptionType({})

builder.subscriptionField('documentUpdated', (t) =>
  t.field({
    type: 'JSON',
    authScopes: { authenticated: true },
    args: {
      scope: t.arg.string({ required: true }),
      documentId: t.arg.id({ required: true }),
    },
    subscribe: (_, { scope, documentId }) => {
      if (scope !== 'inbound' && scope !== 'outbound') {
        throw new Error('scope 须为 inbound 或 outbound')
      }
      return subscribeRealtime(documentChannel(scope, documentId))
    },
    resolve: (payload) => payload,
  }),
)

builder.subscriptionField('opsTodoChanged', (t) =>
  t.field({
    type: 'JSON',
    authScopes: { authenticated: true },
    subscribe: () => subscribeRealtime(OPS_TODO_CHANNEL),
    resolve: (payload) => payload,
  }),
)
