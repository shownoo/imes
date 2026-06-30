import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { gql, useLazyQuery } from '@apollo/client'
import { PageHeader, Badge, Card, CardContent } from 'components/common'
import { InfoTip } from 'components/info-tip'
import { MovementTypeBadge } from 'components/movement-type-badge'
import { QrScanInput } from 'components/qr-scan-input'
import { STATUS_LABELS, formatDate, formatDateTime } from 'lib/utils'

const TRACE = gql`query TraceMaterial($qrCode: String!) { traceMaterial(qrCode: $qrCode) }`

export default function Trace() {
  const [params] = useSearchParams()
  const initialQr = params.get('qr') ?? ''
  const [qrCode, setQrCode] = useState(initialQr)
  const [trace, { data, loading }] = useLazyQuery(TRACE)
  const item = data?.traceMaterial as Record<string, unknown> | null | undefined

  useEffect(() => {
    if (initialQr.trim()) {
      trace({ variables: { qrCode: initialQr.trim() } })
    }
  }, [initialQr, trace])

  return (
    <div>
      <PageHeader title="扫码追溯" titleTip="来源可溯 · 去向可追 · 状态可控" />

      <Card className="mb-8">
        <CardContent className="pt-6">
          <div className="mb-3 flex items-center gap-1.5">
            <span className="text-sm font-medium text-muted-foreground">扫描或输入二维码</span>
            <InfoTip side="right">支持扫码枪输入，回车即可追溯该物资的全链路记录</InfoTip>
          </div>
          <QrScanInput
            value={qrCode}
            onChange={setQrCode}
            onSubmit={(qr) => trace({ variables: { qrCode: qr } })}
            submitLabel="追溯"
            disabled={loading}
            placeholder="输入或扫描物资二维码..."
          />
        </CardContent>
      </Card>

      {item === null && data && <Card><CardContent className="py-12 text-center text-muted-foreground">未找到该二维码对应的物资</CardContent></Card>}

      {item && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <CardContent className="space-y-4 pt-6">
              <div className="flex items-center gap-1.5">
                <h3 className="font-display text-lg font-semibold">物资信息</h3>
                <InfoTip side="right">当前二维码单元的实时状态</InfoTip>
              </div>
              <dl className="grid grid-cols-2 gap-3 text-sm">
                <div><dt className="text-muted-foreground">二维码</dt><dd className="font-mono">{String(item.qrCode)}</dd></div>
                <div><dt className="text-muted-foreground">状态</dt><dd><Badge variant="secondary">{STATUS_LABELS[String(item.status)]}</Badge></dd></div>
                <div><dt className="text-muted-foreground">物资</dt><dd>{(item.material as { name?: string })?.name}</dd></div>
                <div><dt className="text-muted-foreground">数量</dt><dd>{String(item.quantity)}</dd></div>
                <div><dt className="text-muted-foreground">批次</dt><dd>{(item.batch as { batchNo?: string })?.batchNo}</dd></div>
                <div><dt className="text-muted-foreground">效期</dt><dd>{formatDate(String((item.batch as { expiryDate?: string })?.expiryDate))}</dd></div>
              </dl>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="mb-4 flex items-center gap-1.5">
                <h3 className="font-display text-lg font-semibold">流转记录</h3>
                <InfoTip side="right">入库、出库、拆零、移库等全链路操作历史</InfoTip>
              </div>
              <div className="max-h-80 space-y-2 overflow-y-auto">
                {((item.movements as Array<Record<string, unknown>>) ?? []).map((m) => (
                  <div key={String(m.id)} className="rounded-lg border bg-muted/30 p-3 text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <MovementTypeBadge type={String(m.type)} />
                      <span className="text-xs tabular-nums text-muted-foreground">{formatDateTime(String(m.createdAt))}</span>
                    </div>
                    <p className="mt-1.5 text-xs text-muted-foreground">{String(m.note ?? '')}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
