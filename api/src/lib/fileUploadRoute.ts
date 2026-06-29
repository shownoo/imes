import { Hono } from 'hono'
import { mkdir, writeFile, readFile } from 'node:fs/promises'
import path from 'node:path'
import { createHash } from 'node:crypto'
import { resolveIdentity } from './auth.js'
import { getLocalUploadDir, getUploadCapability } from './uploadCapability.js'
import { prisma } from './prisma.js'

const FILE_PREFIX = 'resourceFile'

function safeKeySegment(segment: string): string {
  return segment.replace(/[^a-zA-Z0-9._-]/g, '_')
}

function providerToStorageType(provider: string): 'SELF' | 'COS' | 'QINIU' | 'OSS' | 'S3' | 'MINIO' {
  const map: Record<string, 'SELF' | 'COS' | 'QINIU' | 'OSS' | 'S3' | 'MINIO'> = {
    LOCAL: 'SELF',
    COS: 'COS',
    QINIU: 'QINIU',
    OSS: 'OSS',
    S3: 'S3',
    MINIO: 'MINIO',
  }
  return map[provider] || 'SELF'
}

export const fileUploadRouter = new Hono()

fileUploadRouter.post('/files/upload', async (c) => {
  const cap = await getUploadCapability(prisma)
  if (!cap.enabled) {
    return c.json({ error: 'upload.disabled' }, 503)
  }

  const identity = await resolveIdentity(
    c.req.header('authorization') ?? undefined,
  )
  if (!identity) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const body = await c.req.parseBody()
  const raw = body.file
  if (!raw || !(raw instanceof File)) {
    return c.json({ error: 'upload.missingFile' }, 400)
  }

  const maxBytes = (() => {
    const mime = raw.type || 'application/octet-stream'
    const limitMB = mime.startsWith('image/') ? cap.maxImageMB : cap.maxFileMB
    return limitMB * 1024 * 1024
  })()
  if (raw.size > maxBytes) {
    const mime = raw.type || 'application/octet-stream'
    return c.json(
      { error: mime.startsWith('image/') ? 'upload.imageTooLarge' : 'upload.fileTooLarge' },
      400,
    )
  }

  const buffer = Buffer.from(await raw.arrayBuffer())
  const md5 = createHash('md5').update(buffer).digest('hex')
  const safeName = safeKeySegment(raw.name || 'file')
  const key = `${FILE_PREFIX}/${md5}/${safeName}`.replaceAll('/', '-')

  if (cap.provider === 'LOCAL') {
    const uploadRoot = path.resolve(process.cwd(), getLocalUploadDir())
    const dest = path.join(uploadRoot, key)
    await mkdir(path.dirname(dest), { recursive: true })
    await writeFile(dest, buffer)
  } else {
    return c.json({ error: 'upload.notImplemented' }, 501)
  }

  const mime = raw.type || 'application/octet-stream'
  const storageType = providerToStorageType(cap.provider)
  return c.json({ key, mime, size: raw.size, md5, storageType })
})

fileUploadRouter.get('/files/:key', async (c) => {
  const key = decodeURIComponent(c.req.param('key'))
  if (!key || key.includes('..')) {
    return c.text('Bad request', 400)
  }

  const fileItem = await prisma.fileItem.findUnique({
    where: { key },
  })

  if (!fileItem) {
    return c.text('Not found', 404)
  }

  if (fileItem.storageType === 'SELF') {
    const uploadRoot = path.resolve(process.cwd(), getLocalUploadDir())
    const filePath = path.join(uploadRoot, key)

    try {
      const data = await readFile(filePath)
      const ext = path.extname(key).toLowerCase()
      const mimeByExt: Record<string, string> = {
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.gif': 'image/gif',
        '.webp': 'image/webp',
        '.pdf': 'application/pdf',
      }
      const contentType = fileItem.mimeType || mimeByExt[ext] || 'application/octet-stream'
      return new Response(data, {
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'private, max-age=3600',
        },
      })
    } catch {
      return c.text('Not found', 404)
    }
  }

  return c.json({ error: 'cloudStorage.notImplemented' }, 501)
})
