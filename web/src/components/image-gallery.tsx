import { useCallback, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, ImagePlus, Loader2, Trash2, ZoomIn } from 'lucide-react'
import { cn } from 'lib/utils'
import { useUploadCapability } from 'hooks/use-upload-capability'
import { formatApiError } from 'lib/api-error'
import { uploadAndRegisterImage } from 'lib/register-image'
import { Dialog, DialogContent } from 'components/ui/dialog'

export type GalleryImage = {
  id: string
  url: string
  name?: string
}

type ImageGalleryProps = {
  value: GalleryImage[]
  onChange: (images: GalleryImage[]) => void
  max?: number
  disabled?: boolean
  className?: string
}

const DEFAULT_MAX = 9

export function ImageGallery({
  value,
  onChange,
  max = DEFAULT_MAX,
  disabled,
  className,
}: ImageGalleryProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [previewIndex, setPreviewIndex] = useState<number | null>(null)
  const { enabled, maxImageMB, reason, loading: capLoading } = useUploadCapability()

  const canAdd = !disabled && enabled && value.length < max

  const handlePick = useCallback(() => {
    if (!canAdd || uploading) return
    inputRef.current?.click()
  }, [canAdd, uploading])

  const handleFiles = useCallback(async (files: FileList | null) => {
    if (!files?.length || !canAdd) return

    const remaining = max - value.length
    const picked = Array.from(files)
      .filter((f) => f.type.startsWith('image/'))
      .slice(0, remaining)

    if (!picked.length) {
      setUploadError('请选择图片文件')
      return
    }

    const maxBytes = maxImageMB * 1024 * 1024
    const oversized = picked.find((f) => f.size > maxBytes)
    if (oversized) {
      setUploadError(`单张图片不能超过 ${maxImageMB} MB`)
      return
    }

    setUploadError(null)
    setUploading(true)
    try {
      const added: GalleryImage[] = []
      for (const file of picked) {
        const item = await uploadAndRegisterImage(file)
        if (value.some((img) => img.id === item.id)) continue
        added.push({ id: item.id, url: item.url, name: item.name })
      }
      if (!added.length) {
        setUploadError('所选图片已在列表中')
        return
      }
      onChange([...value, ...added])
    } catch (e) {
      setUploadError(formatApiError(e instanceof Error ? e.message : '', '上传失败'))
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }, [canAdd, max, maxImageMB, onChange, value])

  const removeAt = (index: number) => {
    onChange(value.filter((_, i) => i !== index))
    if (previewIndex === index) setPreviewIndex(null)
    else if (previewIndex !== null && previewIndex > index) setPreviewIndex(previewIndex - 1)
  }

  const showPreview = previewIndex !== null ? value[previewIndex] : null

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex flex-wrap gap-3">
        {value.map((img, index) => (
          <div
            key={img.id}
            className="group relative size-24 overflow-hidden rounded-lg border border-border bg-muted/30"
          >
            <img
              src={img.url}
              alt={img.name ?? `图片 ${index + 1}`}
              className="size-full object-cover"
            />
            <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/0 opacity-0 transition-all group-hover:bg-black/40 group-hover:opacity-100">
              <button
                type="button"
                className="flex size-8 items-center justify-center rounded-full bg-white/90 text-foreground shadow-sm transition hover:bg-white"
                onClick={() => setPreviewIndex(index)}
                aria-label='浏览'
              >
                <ZoomIn className="size-4" />
              </button>
              {!disabled && (
                <button
                  type="button"
                  className="flex size-8 items-center justify-center rounded-full bg-white/90 text-destructive shadow-sm transition hover:bg-white"
                  onClick={() => removeAt(index)}
                  aria-label='删除'
                >
                  <Trash2 className="size-4" />
                </button>
              )}
            </div>
          </div>
        ))}

        {canAdd && (
          <button
            type="button"
            onClick={handlePick}
            disabled={uploading || capLoading}
            className="flex size-24 flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-border/80 bg-muted/20 text-muted-foreground transition hover:border-primary/40 hover:bg-muted/40 hover:text-foreground disabled:opacity-50"
          >
            {uploading ? (
              <Loader2 className="size-5 animate-spin" />
            ) : (
              <ImagePlus className="size-5" />
            )}
            <span className="text-xs">{uploading ? '上传中' : '添加图片'}</span>
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => void handleFiles(e.target.files)}
      />

      {uploadError && (
        <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
          {uploadError}
        </p>
      )}

      {!capLoading && !enabled && (
        <p className="text-xs text-muted-foreground">
          {reason ? `图片上传不可用：${reason}` : '图片上传未启用，请联系管理员配置存储'}
        </p>
      )}

      {enabled && (
        <p className="text-xs text-muted-foreground">
          最多 {max} 张 · 单张不超过 {maxImageMB} MB
          {value.length > 0 ? ` · 已添加 ${value.length} 张` : ''}
        </p>
      )}

      <Dialog open={previewIndex !== null} onOpenChange={(open) => !open && setPreviewIndex(null)}>
        <DialogContent className="max-w-3xl border-none bg-black/95 p-0 text-white shadow-2xl sm:rounded-xl">
          {showPreview && previewIndex !== null && (
            <div className="relative flex min-h-[50vh] items-center justify-center p-4">
              <img
                src={showPreview.url}
                alt={showPreview.name ?? ''}
                className="max-h-[75vh] max-w-full object-contain"
              />
              {value.length > 1 && (
                <>
                  <button
                    type="button"
                    className="absolute left-3 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur transition hover:bg-white/20"
                    onClick={() => setPreviewIndex((previewIndex - 1 + value.length) % value.length)}
                  >
                    <ChevronLeft className="size-6" />
                  </button>
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur transition hover:bg-white/20"
                    onClick={() => setPreviewIndex((previewIndex + 1) % value.length)}
                  >
                    <ChevronRight className="size-6" />
                  </button>
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-3 py-1 text-xs text-white/80 backdrop-blur">
                    {previewIndex + 1} / {value.length}
                  </div>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

/** 列表缩略图：叠放展示多图，点击可浏览 */
export function ImageThumb({
  images,
  totalCount,
}: {
  images?: Array<{ file?: { url?: string; name?: string } }>
  totalCount?: number
}) {
  const items = (images ?? [])
    .flatMap((img) => {
      const url = img.file?.url
      return url ? [{ url, name: img.file?.name }] : []
    })

  const count = totalCount ?? items.length
  const [previewIndex, setPreviewIndex] = useState<number | null>(null)

  if (!items.length) {
    return null
  }

  const stack = items.slice(0, Math.min(items.length, count >= 2 ? 2 : 1))
  const showTotalBadge = count > stack.length

  return (
    <>
      <button
        type="button"
        onClick={() => setPreviewIndex(0)}
        className="group relative flex h-10 items-center outline-none"
        aria-label={`查看 ${count} 张图片`}
      >
        <span className="flex items-center">
          {stack.map((item, index) => (
            <span
              key={`${item.url}-${index}`}
              className={cn(
                'relative block size-9 overflow-hidden rounded-md border-2 border-background bg-muted shadow-sm ring-1 ring-border/50 transition group-hover:ring-primary/40',
                index > 0 && '-ml-3',
              )}
              style={{ zIndex: stack.length - index }}
            >
              <img src={item.url} alt="" className="size-full object-cover" />
            </span>
          ))}
        </span>
        {showTotalBadge && (
          <span className="absolute -right-1 -top-1 z-10 flex size-4 items-center justify-center rounded-full bg-foreground/80 text-[9px] font-medium text-background shadow-sm">
            {count}
          </span>
        )}
      </button>

      <Dialog open={previewIndex !== null} onOpenChange={(open) => !open && setPreviewIndex(null)}>
        <DialogContent className="max-w-3xl border-none bg-black/95 p-0 text-white shadow-2xl sm:rounded-xl">
          {previewIndex !== null && items[previewIndex] && (
            <div className="relative flex min-h-[50vh] items-center justify-center p-4">
              <img
                src={items[previewIndex].url}
                alt={items[previewIndex].name ?? ''}
                className="max-h-[75vh] max-w-full object-contain"
              />
              {items.length > 1 && (
                <>
                  <button
                    type="button"
                    className="absolute left-3 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur transition hover:bg-white/20"
                    onClick={() => setPreviewIndex((previewIndex - 1 + items.length) % items.length)}
                  >
                    <ChevronLeft className="size-6" />
                  </button>
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur transition hover:bg-white/20"
                    onClick={() => setPreviewIndex((previewIndex + 1) % items.length)}
                  >
                    <ChevronRight className="size-6" />
                  </button>
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-3 py-1 text-xs text-white/80 backdrop-blur">
                    {previewIndex + 1} / {count}
                  </div>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
