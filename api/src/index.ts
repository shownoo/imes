import './load-env.js'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { serve } from '@hono/node-server'
import { createYoga } from 'graphql-yoga'
import { useDisableIntrospection } from '@graphql-yoga/plugin-disable-introspection'
import { builder } from './builder.js'
import { createContext } from './context.js'
import { fileUploadRouter } from './lib/fileUploadRoute.js'
import { prisma } from './lib/prisma.js'
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
app.get('/health', (c) => c.json({ status: 'ok', service: 'imes-api' }))

const server = serve({ fetch: app.fetch, port, hostname: '0.0.0.0' }, () => {
  console.log(`🚀 IMES API → http://localhost:${port}/graphql`)
  startApprovalScheduler(prisma)
})

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
