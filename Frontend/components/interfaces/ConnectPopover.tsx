'use client'

import React, { useState } from 'react'
import { Check, Copy, Database, ExternalLink, Plug, Terminal } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MOCK_PROJECT } from '@/lib/mock-data'
import { copyToClipboard } from '@/lib/utils'

export function ConnectPopover() {
  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  const handleCopy = (text: string, key: string) => {
    copyToClipboard(text, () => {
      setCopiedKey(key)
      setTimeout(() => setCopiedKey(null), 2000)
    })
  }

  const directUri = `postgresql://${MOCK_PROJECT.connectionInfo.user}:[YOUR-PASSWORD]@${MOCK_PROJECT.connectionInfo.host}:${MOCK_PROJECT.connectionInfo.port}/${MOCK_PROJECT.connectionInfo.database}`
  const poolerUri = `postgresql://${MOCK_PROJECT.connectionInfo.user}.[PROJECT-REF]:[YOUR-PASSWORD]@${MOCK_PROJECT.connectionInfo.poolerHost}:${MOCK_PROJECT.connectionInfo.poolerPort}/${MOCK_PROJECT.connectionInfo.database}?pgbouncer=true`
  const psqlCmd = `psql -h ${MOCK_PROJECT.connectionInfo.host} -p 5432 -d postgres -U postgres`

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="primary"
          size="small"
          iconLeft={<Plug className="h-3.5 w-3.5 rotate-90" />}
          className="gap-1.5 font-medium shadow-xs rounded-full px-3 ml-3"
        >
          <span>Connect</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl bg-surface-100 border-overlay">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <DialogTitle>Connect to {MOCK_PROJECT.name}</DialogTitle>
            <Badge variant="brand">Active</Badge>
          </div>
          <DialogDescription>
            Direct connection and connection pooling strings for your database.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="uri" className="w-full">
          <TabsList className="px-0">
            <TabsTrigger value="uri">Connection String (URI)</TabsTrigger>
            <TabsTrigger value="pooler">Transaction Pooler</TabsTrigger>
            <TabsTrigger value="psql">PSQL</TabsTrigger>
            <TabsTrigger value="parameters">Parameters</TabsTrigger>
          </TabsList>

          <TabsContent value="uri" className="space-y-4 pt-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground-light">Direct Connection</label>
              <div className="relative flex items-center">
                <input
                  readOnly
                  value={directUri}
                  className="w-full font-mono text-xs bg-surface-200 border border-strong rounded-md px-3 py-2 text-foreground pr-10"
                />
                <Button
                  size="tiny"
                  variant="ghost"
                  onClick={() => handleCopy(directUri, 'direct')}
                  className="absolute right-1.5"
                >
                  {copiedKey === 'direct' ? <Check className="h-3.5 w-3.5 text-brand-500" /> : <Copy className="h-3.5 w-3.5" />}
                </Button>
              </div>
              <p className="text-[11px] text-foreground-lighter">
                Use this for serverful applications and local migrations.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="pooler" className="space-y-4 pt-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground-light">Session / Transaction Pooler (Supavisor)</label>
              <div className="relative flex items-center">
                <input
                  readOnly
                  value={poolerUri}
                  className="w-full font-mono text-xs bg-surface-200 border border-strong rounded-md px-3 py-2 text-foreground pr-10"
                />
                <Button
                  size="tiny"
                  variant="ghost"
                  onClick={() => handleCopy(poolerUri, 'pooler')}
                  className="absolute right-1.5"
                >
                  {copiedKey === 'pooler' ? <Check className="h-3.5 w-3.5 text-brand-500" /> : <Copy className="h-3.5 w-3.5" />}
                </Button>
              </div>
              <p className="text-[11px] text-foreground-lighter">
                Recommended for serverless environments (Next.js, AWS Lambda, Cloudflare Workers).
              </p>
            </div>
          </TabsContent>

          <TabsContent value="psql" className="space-y-4 pt-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground-light">CLI Terminal Command</label>
              <div className="relative flex items-center">
                <input
                  readOnly
                  value={psqlCmd}
                  className="w-full font-mono text-xs bg-surface-200 border border-strong rounded-md px-3 py-2 text-foreground pr-10"
                />
                <Button
                  size="tiny"
                  variant="ghost"
                  onClick={() => handleCopy(psqlCmd, 'psql')}
                  className="absolute right-1.5"
                >
                  {copiedKey === 'psql' ? <Check className="h-3.5 w-3.5 text-brand-500" /> : <Copy className="h-3.5 w-3.5" />}
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="parameters" className="pt-3">
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-2.5 rounded bg-surface-200 border border-strong">
                <div className="text-foreground-lighter text-[11px]">Host</div>
                <div className="font-mono text-foreground mt-0.5 truncate">{MOCK_PROJECT.connectionInfo.host}</div>
              </div>
              <div className="p-2.5 rounded bg-surface-200 border border-strong">
                <div className="text-foreground-lighter text-[11px]">Port</div>
                <div className="font-mono text-foreground mt-0.5">5432</div>
              </div>
              <div className="p-2.5 rounded bg-surface-200 border border-strong">
                <div className="text-foreground-lighter text-[11px]">Database</div>
                <div className="font-mono text-foreground mt-0.5">{MOCK_PROJECT.connectionInfo.database}</div>
              </div>
              <div className="p-2.5 rounded bg-surface-200 border border-strong">
                <div className="text-foreground-lighter text-[11px]">User</div>
                <div className="font-mono text-foreground mt-0.5">{MOCK_PROJECT.connectionInfo.user}</div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
