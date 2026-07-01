const Koa = require('koa')
const send = require('koa-send')
const app = new Koa()

app.use(async (ctx, next) => {
  const protocol = ctx.request.headers['x-forwarded-proto']
  if (protocol === 'http') {
    ctx.response.status = 307
    ctx.response.redirect(`https://${ctx.host}${ctx.url}`)
    ctx.response.body = 'Redirecting to https'
    return
  }
  await next()
})

app.use(async (ctx, next) => {
  const url = ctx.path
  const shouldServeStatic =
    url.startsWith('/imesassetsv2/') ||
    url.startsWith('/assets/') ||
    /\.(js|css|map|png|jpg|jpeg|gif|svg|webp|ico|woff2?|ttf|eot)$/.test(url)

  if (!shouldServeStatic) {
    await next()
    return
  }

  try {
    await send(ctx, url, { root: `${__dirname}/site` })
  } catch {
    ctx.status = 404
    ctx.body = 'Not Found'
  }
})

app.use(async (ctx) => {
  await send(ctx, '/index.html', { root: `${__dirname}/site` })
})

app.listen(5000)
console.log('listening on port 5000')
