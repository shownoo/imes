const ERROR_MESSAGES: Record<string, string> = {
  'upload.disabled': '文件上传未启用',
  'upload.noApiUrl': '未配置 API 地址',
  'upload.missingFile': '未选择文件',
  'upload.fileTooLarge': '文件过大',
  'upload.imageTooLarge': '图片过大',
  'upload.failed': '上传失败',
  'register.failed': '文件登记失败',
  Unauthorized: '未授权，请重新登录',
}

export function formatApiError(raw: string, fallback = '操作失败，请稍后重试'): string {
  const trimmed = raw.trim()
  if (!trimmed) return fallback
  if (ERROR_MESSAGES[trimmed]) return ERROR_MESSAGES[trimmed]

  if (trimmed.includes('Unique constraint failed')) {
    return '该文件已存在，请勿重复上传'
  }
  if (trimmed.includes('Unauthorized')) {
    return ERROR_MESSAGES.Unauthorized
  }

  const lines = trimmed
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('→') && !line.includes('invocation in'))

  const concise = lines.find((line) => line.length <= 120 && !line.includes('ctx.prisma'))
  if (concise) return concise

  return fallback
}
