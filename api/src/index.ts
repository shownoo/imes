import './load-env.js'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { serve } from '@hono/node-server'
import { createYoga } from 'graphql-yoga'
import { useDisableIntrospection } from '@graphql-yoga/plugin-disable-introspection'
import { useServer } from 'graphql-ws/use/ws'
import type { Server as HttpServer } from 'node:http'
import { WebSocketServer } from 'ws'
import { builder } from './builder.js'
import { createContext, createWsContext } from './context.js'
import { fileUploadRouter } from './lib/fileUploadRoute.js'
import { prisma } from './lib/prisma.js'
import { connectRedis, closeRedis, isRedisConnected, isRedisConfigured } from './lib/redis.js'
import { startRealtimeBus, stopRealtimeBus } from './lib/realtime-bus.js'
import { startApprovalScheduler } from './lib/approval-scheduler.js'
import './schema/index.js'

const schema = builder.toSchema()

const yoga = createYoga({
  schema,
  context: createContext,
  graphiql: process.env.NODE_ENV !== 'production',
  maskedErrors: process.env.NODE_ENV === 'production',
  plugins: [
    ...(process.env.NODE_ENV === 'production' ? [useDisableIntrospection()] : []),
  ],
  cors: { origin: '*', methods: ['GET', 'POST', 'OPTIONS'], allowedHeaders: ['Content-Type', 'Authorization'] },
  landingPage: false,
})

const port = Number(process.env.PORT) || 3200

const app = new Hono()
app.use('*', logger())
app.use('*', cors({ origin: '*', allowMethods: ['GET', 'POST', 'PUT', 'OPTIONS'], allowHeaders: ['Content-Type', 'Authorization'] }))
app.route('', fileUploadRouter)
app.on(['GET', 'POST', 'OPTIONS'], '/graphql', (c) => yoga.fetch(c.req.raw, { env: c.env }))
app.get('/health', (c) =>
  c.json({
    status: 'ok',
    service: 'imes-api',
    redis: !isRedisConfigured() ? 'off' : isRedisConnected() ? 'connected' : 'unavailable',
    realtime: 'ws',
  }),
)

let wsServer: WebSocketServer | null = null

function attachGraphqlWs(httpServer: HttpServer) {
  wsServer = new WebSocketServer({ noServer: true })

  useServer(
    {
      schema,
      context: (ctx) => createWsContext(ctx.connectionParams as Record<string, unknown> | undefined),
      onConnect: async (ctx) => {
        const wsCtx = await createWsContext(ctx.connectionParams as Record<string, unknown> | undefined)
        if (!wsCtx.isAuthenticated) return false
        return true
      },
    },
    wsServer,
  )

  httpServer.on('upgrade', (request, socket, head) => {
    const url = request.url ?? ''
    if (url.startsWith('/graphql')) {
      wsServer?.handleUpgrade(request, socket, head, (ws) => {
        wsServer?.emit('connection', ws, request)
      })
      return
    }
    socket.destroy()
  })
}

const server = serve({ fetch: app.fetch, port, hostname: '0.0.0.0' }, () => {
  console.log(`🚀 IMES API → http://localhost:${port}/graphql`)
  attachGraphqlWs(server as HttpServer)
  console.log(`🔌 GraphQL WS → ws://localhost:${port}/graphql`)
  void connectRedis().then(async (ok) => {
    if (ok) console.log('✓ Redis cache enabled')
    else if (isRedisConfigured()) console.warn('⚠ Redis 未就绪，已跳过缓存（直接查库）')
    await startRealtimeBus()
    if (isRedisConnected()) console.log('✓ Realtime bus (Redis pub/sub)')
    else console.log('✓ Realtime bus (in-memory, 单实例)')
  })
  startApprovalScheduler(prisma)
})

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, () => {
    void Promise.all([stopRealtimeBus(), closeRedis()]).finally(() => {
      wsServer?.close()
      process.exit(0)
    })
  })
}

server.on('error', (err: NodeJS.ErrnoException) => {
  if (err.code === 'EADDRINUSE') {
    console.error(
      `❌ 端口 ${port} 已被占用。请先停止旧进程再启动：\n` +
        `   lsof -tiTCP:${port} | xargs kill -9`,
    )
    process.exit(1)
  }
  console.error('HTTP server error:', err)
})
