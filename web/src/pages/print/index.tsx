import { useCallback, useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Printer, RefreshCw, X } from 'lucide-react'
import { useApolloClient } from '@apollo/client'
import { Button } from 'components/common'
import { LEGAL_PRINT_TEMPLATE, PRINT_TEMPLATE_LABELS, type PrintTemplateKey } from 'lib/print-keys'
import { replaceTemplateVariables, wrapPrintHtml } from 'lib/print-template'
import {
  GET_INBOUND_FOR_PRINT,
  GET_OUTBOUND_FOR_PRINT,
  GET_PRINT_TEMPLATE,
} from './queries'

const DATA_QUERY_MAP: Record<PrintTemplateKey, typeof GET_INBOUND_FOR_PRINT> = {
  [LEGAL_PRINT_TEMPLATE.PrintInbound]: GET_INBOUND_FOR_PRINT,
  [LEGAL_PRINT_TEMPLATE.PrintOutbound]: GET_OUTBOUND_FOR_PRINT,
}

const DATA_KEY_MAP: Record<PrintTemplateKey, string> = {
  [LEGAL_PRINT_TEMPLATE.PrintInbound]: 'getInboundOrderForPrint',
  [LEGAL_PRINT_TEMPLATE.PrintOutbound]: 'getOutboundOrderForPrint',
}

export default function PrintPage() {
  const { key, id } = useParams()
  const navigate = useNavigate()
  const client = useApolloClient()
  const iframeRef = useRef<HTMLIFrameElement>(null)

  const [htmlContent, setHtmlContent] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const isNewTab = window.history.length <= 1
  const templateKey = key as PrintTemplateKey | undefined
  const templateLabel = templateKey ? PRINT_TEMPLATE_LABELS[templateKey] ?? key : ''

  const fetchAndRender = useCallback(async () => {
    if (!templateKey || !id) return

    const isValidKey = Object.values(LEGAL_PRINT_TEMPLATE).includes(templateKey)
    if (!isValidKey) {
      setError('无效的模板类型')
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const dataQuery = DATA_QUERY_MAP[templateKey]
      const dataKey = DATA_KEY_MAP[templateKey]

      const [templateResult, dataResult] = await Promise.all([
        client.query({
          query: GET_PRINT_TEMPLATE,
          variables: { input: { key: templateKey } },
          fetchPolicy: 'no-cache',
        }),
        client.query({
          query: dataQuery,
          variables: { input: { id } },
          fetchPolicy: 'no-cache',
        }),
      ])

      const templateSetting = templateResult.data?.getPrintTemplate as {
        value?: { html?: string }
        html?: string
      } | null
      const templateHtml = templateSetting?.value?.html ?? templateSetting?.html ?? null

      if (!templateHtml) {
        setError('打印模板未配置，请联系管理员')
        return
      }

      const documentData = dataResult.data?.[dataKey] as Record<string, unknown> | null
      if (!documentData) {
        setError('未找到单据数据')
        return
      }

      const processedHtml = replaceTemplateVariables(templateHtml, documentData)
      const orderNo = String(documentData.orderNo ?? id)
      setHtmlContent(wrapPrintHtml(processedHtml, `${templateLabel} - ${orderNo}`))
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败')
    } finally {
      setLoading(false)
    }
  }, [templateKey, id, client, templateLabel])

  useEffect(() => {
    void fetchAndRender()
  }, [fetchAndRender])

  const handlePrint = useCallback(() => {
    iframeRef.current?.contentWindow?.print()
  }, [])

  const handleClose = useCallback(() => {
    if (isNewTab) window.close()
    else navigate(-1)
  }, [isNewTab, navigate])

  if (loading) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-3">
        <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <span className="text-sm text-muted-foreground">正在加载{templateLabel}…</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4">
        <div className="text-sm text-destructive">{error}</div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => void fetchAndRender()}>
            <RefreshCw className="size-4" /> 重试
          </Button>
          <Button variant="outline" onClick={handleClose}>
            {isNewTab ? <X className="size-4" /> : <ArrowLeft className="size-4" />}
            {isNewTab ? '关闭' : '返回'}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen flex-col bg-muted/30">
      <div className="flex shrink-0 items-center justify-between border-b bg-background px-4 py-3 shadow-sm">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={handleClose}>
            {isNewTab ? <X className="size-4" /> : <ArrowLeft className="size-4" />}
            {isNewTab ? '关闭' : '返回'}
          </Button>
          {templateLabel && <span className="text-sm font-medium">{templateLabel}</span>}
        </div>
        <Button size="sm" onClick={handlePrint}>
          <Printer className="size-4" /> 打印
        </Button>
      </div>
      <div className="flex-1 overflow-hidden p-4">
        {htmlContent && (
          <iframe
            ref={iframeRef}
            srcDoc={htmlContent}
            className="mx-auto size-full max-w-[210mm] rounded-lg border bg-white shadow-lg"
            title={`${templateLabel} 打印预览`}
          />
        )}
      </div>
    </div>
  )
}
