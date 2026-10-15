'use client'

import React, { useState, useEffect } from 'react'
import {
  Archive,
  Download,
  RotateCcw,
  Trash2,
  MoreHorizontal,
  Plus,
  Search,
  Check,
  X,
  AlertTriangle,
  HardDrive,
  Loader2,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export type BackupType = 'Manual'

export interface DatabaseBackup {
  id: string
  name: string
  type: BackupType
  size: string
  createdAt: string
  retention: string
  isLatest?: boolean
}

// ─── Tag badge styling: same gray border and surface as Branches ─────────
function getTypeBadgeStyle() {
  return 'border-strong text-foreground-lighter bg-surface-200'
}

const DEFAULT_BACKUPS: DatabaseBackup[] = [
  {
    id: 'bk_manual_1',
    name: 'manual-backup-2026-10-14',
    type: 'Manual',
    size: '42.8 MB',
    createdAt: '2026-10-14 02:15:20',
    retention: 'Permanent',
    isLatest: true,
  },
  {
    id: 'bk_manual_2',
    name: 'pre-migration-auth-v2',
    type: 'Manual',
    size: '42.5 MB',
    createdAt: '2026-10-13 18:45:00',
    retention: 'Permanent',
  },
  {
    id: 'bk_manual_3',
    name: 'pre-deploy-prod-release',
    type: 'Manual',
    size: '41.2 MB',
    createdAt: '2026-10-12 15:20:41',
    retention: 'Permanent',
  },
  {
    id: 'bk_manual_4',
    name: 'schema-update-checkpoint',
    type: 'Manual',
    size: '39.8 MB',
    createdAt: '2026-10-10 11:32:10',
    retention: 'Permanent',
  },
  {
    id: 'bk_manual_5',
    name: 'initial-setup-baseline',
    type: 'Manual',
    size: '38.4 MB',
    createdAt: '2026-10-06 09:14:00',
    retention: 'Permanent',
  },
]

export function BackupsPageView() {
  const [backups, setBackups] = useState<DatabaseBackup[]>(DEFAULT_BACKUPS)
  const [search, setSearch] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  // Dialog states
  const [createOpen, setCreateOpen] = useState(false)
  const [restoreOpen, setRestoreOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [targetBackup, setTargetBackup] = useState<DatabaseBackup | null>(null)

  // Create form state
  const [newBackupName, setNewBackupName] = useState('')
  const [newRetention, setNewRetention] = useState('Permanent')

  // Load from localStorage (v2 for clean manual-only entries)
  useEffect(() => {
    try {
      const stored = localStorage.getItem('pgbase_backups_v2')
      if (stored) {
        setBackups(JSON.parse(stored))
      }
    } catch {
      // fallback
    }
  }, [])

  const saveBackups = (items: DatabaseBackup[]) => {
    setBackups(items)
    try {
      localStorage.setItem('pgbase_backups_v2', JSON.stringify(items))
    } catch {
      // ignore
    }
  }

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev))
    }, 4000)
  }

  // Filtered list
  const filtered = backups.filter((b) =>
    b.name.toLowerCase().includes(search.toLowerCase())
  )

  // ─── Create Backup (Manual only) ───────────────────────────
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newBackupName.trim() || isLoading) return
    setIsLoading(true)
    await new Promise((r) => setTimeout(r, 800))

    const now = new Date()
    const formattedDate = `${now.toISOString().split('T')[0]} ${now.toTimeString().split(' ')[0]}`

    // Reset old latest
    const prevBackups = backups.map((b) => ({ ...b, isLatest: false }))

    const newBackup: DatabaseBackup = {
      id: `bk_${Date.now()}`,
      name: newBackupName.trim().replace(/\s+/g, '-'),
      type: 'Manual',
      size: '42.8 MB',
      createdAt: formattedDate,
      retention: newRetention,
      isLatest: true,
    }

    saveBackups([newBackup, ...prevBackups])
    setIsLoading(false)
    setCreateOpen(false)
    setNewBackupName('')
    setNewRetention('Permanent')
    showToast(`Backup "${newBackup.name}" created successfully.`)
  }

  // ─── Restore Backup ─────────────────────────────────────────
  const handleRestore = async () => {
    if (!targetBackup || isLoading) return
    setIsLoading(true)
    await new Promise((r) => setTimeout(r, 1200))
    setIsLoading(false)
    setRestoreOpen(false)
    showToast(`Database successfully restored to snapshot "${targetBackup.name}".`)
    setTargetBackup(null)
  }

  // ─── Delete Backup ──────────────────────────────────────────
  const handleDelete = async () => {
    if (!targetBackup || isLoading) return
    setIsLoading(true)
    await new Promise((r) => setTimeout(r, 600))

    const updated = backups.filter((b) => b.id !== targetBackup.id)
    if (targetBackup.isLatest && updated.length > 0) {
      updated[0].isLatest = true
    }
    saveBackups(updated)
    setIsLoading(false)
    setDeleteOpen(false)
    showToast(`Backup "${targetBackup.name}" deleted successfully.`)
    setTargetBackup(null)
  }

  // ─── Download Backup ────────────────────────────────────────
  const handleDownload = (backup: DatabaseBackup) => {
    const fakeSql = `-- PgBase Snapshot Dump\n-- Database: postgres\n-- Backup: ${backup.name}\n-- Timestamp: ${backup.createdAt}\n-- Size: ${backup.size}\n\nSET client_encoding = 'UTF8';\n-- Schema dump completed.\n`
    const blob = new Blob([fakeSql], { type: 'text/sql' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${backup.name}.sql`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    showToast(`Downloading "${backup.name}.sql"...`)
  }

  return (
    <div className="flex-1 overflow-y-auto bg-studio p-6 md:p-8 space-y-6 w-full">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-default">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground flex items-center gap-2.5">
            <Archive className="h-5 w-5 text-foreground-lighter" />
            Database Backups
          </h1>
          <p className="text-sm text-foreground-lighter mt-1">
            Manage point-in-time recovery, download SQL dumps, and restore database snapshots.
          </p>
        </div>
        <Button
          variant="default"
          size="small"
          iconLeft={<Plus className="h-3.5 w-3.5" />}
          onClick={() => {
            const now = new Date()
            const stamp = `${now.toISOString().split('T')[0]}_${now.getHours()}-${now.getMinutes()}`
            setNewBackupName(`manual-backup-${stamp}`)
            setCreateOpen(true)
          }}
          className="gap-1.5 font-medium shadow-xs"
        >
          Create backup
        </Button>
      </div>

      {/* Search & Stats Bar */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-foreground-lighter" />
          <Input
            placeholder="Search backups..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-surface-100 border-default text-xs h-8 text-foreground placeholder:text-foreground-muted focus-visible:ring-1 focus-visible:ring-strong focus-visible:border-strong"
          />
        </div>
        <div className="flex items-center gap-2 text-xs text-foreground-lighter flex-wrap">
          <span>{filtered.length} backups</span>
          <span className="text-border-strong">•</span>
          <span>Total storage: ~204.7 MB</span>
        </div>
      </div>

      {/* Backups List */}
      <div className="rounded-lg border border-default bg-surface-100 overflow-hidden divide-y divide-border-muted shadow-xs">
        {/* Table Header */}
        <div className="grid grid-cols-12 gap-4 px-4 py-2.5 bg-surface-200/50 text-[11px] font-medium uppercase tracking-wider text-foreground-lighter">
          <div className="col-span-4">Backup name</div>
          <div className="col-span-2">Type</div>
          <div className="col-span-3">Size</div>
          <div className="col-span-2">Created at</div>
          <div className="col-span-1 text-right">Actions</div>
        </div>

        {/* Rows */}
        {filtered.map((backup) => (
          <div
            key={backup.id}
            className="grid grid-cols-12 gap-4 px-4 py-3 items-center hover:bg-surface-200/40 transition-colors group text-sm"
          >
            {/* Backup name + latest badge */}
            <div className="col-span-4 flex items-center gap-2.5 min-w-0">
              <Archive className="h-4 w-4 text-foreground-lighter shrink-0" />
              <span className="font-medium text-foreground truncate font-mono text-xs">
                {backup.name}
              </span>
              {backup.isLatest && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 shrink-0">
                  latest
                </span>
              )}
            </div>

            {/* Type with same gray border as Branches */}
            <div className="col-span-2">
              <span
                className={cn(
                  'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider border',
                  getTypeBadgeStyle()
                )}
              >
                {backup.type}
              </span>
            </div>

            {/* Size */}
            <div className="col-span-3 flex items-center gap-1.5 text-foreground-lighter">
              <HardDrive className="h-3 w-3 text-foreground-muted" />
              <span className="font-mono text-xs">{backup.size}</span>
            </div>

            {/* Created */}
            <span className="col-span-2 text-xs text-foreground-lighter font-mono">
              {backup.createdAt}
            </span>

            {/* Actions Dropdown */}
            <div className="col-span-1 flex justify-end">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="h-7 w-7 flex items-center justify-center rounded-md text-foreground-lighter hover:text-foreground hover:bg-surface-300 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-44 bg-surface-100 border-default text-foreground shadow-xl"
                >
                  <DropdownMenuItem
                    className="text-xs gap-2 cursor-pointer"
                    onSelect={() => handleDownload(backup)}
                  >
                    <Download className="h-3.5 w-3.5 text-foreground-lighter" />
                    Download SQL dump
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-xs gap-2 cursor-pointer"
                    onSelect={() => {
                      setTargetBackup(backup)
                      setRestoreOpen(true)
                    }}
                  >
                    <RotateCcw className="h-3.5 w-3.5 text-foreground-lighter" />
                    Restore backup
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-border-muted" />
                  <DropdownMenuItem
                    className="text-xs gap-2 text-destructive focus:text-destructive cursor-pointer"
                    onSelect={() => {
                      setTargetBackup(backup)
                      setDeleteOpen(true)
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    Delete backup
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="px-4 py-12 text-center text-sm text-foreground-lighter">
            No backups found. Create your first backup snapshot to protect your data.
          </div>
        )}
      </div>

      {/* ──────────────── Create Backup Dialog ──────────────── */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md p-6 bg-surface-100 border-default text-foreground shadow-2xl rounded-lg">
          <form onSubmit={handleCreate}>
            <DialogHeader className="pb-3 border-b border-default text-left">
              <DialogTitle className="text-base font-semibold text-foreground flex items-center gap-2">
                <Archive className="h-4 w-4 text-foreground-lighter" />
                Create database backup
              </DialogTitle>
              <DialogDescription className="text-xs text-foreground-lighter mt-1">
                Take an immediate point-in-time manual snapshot of your database.
              </DialogDescription>
            </DialogHeader>

            <div className="py-4 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">
                  Backup name <span className="text-destructive">*</span>
                </label>
                <Input
                  placeholder="e.g. pre-migration-v2, weekly-snapshot"
                  value={newBackupName}
                  onChange={(e) => setNewBackupName(e.target.value)}
                  disabled={isLoading}
                  required
                  autoFocus
                  className="bg-surface-200 border-strong text-foreground placeholder:text-foreground-muted text-xs h-9 focus-visible:ring-1 focus-visible:ring-strong focus-visible:border-strong"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">Retention policy</label>
                <select
                  value={newRetention}
                  onChange={(e) => setNewRetention(e.target.value)}
                  disabled={isLoading}
                  className="w-full bg-surface-200 border border-strong rounded-md text-xs h-9 px-2.5 text-foreground outline-none focus:ring-1 focus:ring-strong cursor-pointer"
                >
                  <option value="Permanent">Permanent (Keep indefinitely)</option>
                  <option value="30 days">30 days retention</option>
                  <option value="7 days">7 days retention</option>
                </select>
              </div>
            </div>

            <DialogFooter className="pt-3 border-t border-default flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setCreateOpen(false)}
                disabled={isLoading}
                className="px-3 py-1.5 text-xs font-medium text-foreground-lighter hover:text-foreground hover:bg-surface-200 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!newBackupName.trim() || isLoading}
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-foreground bg-surface-300 hover:bg-surface-200 disabled:opacity-50 disabled:pointer-events-none border border-strong rounded-md transition-colors shadow-xs"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Creating backup...
                  </>
                ) : (
                  'Create backup'
                )}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ──────────────── Restore Confirmation Dialog (matches DeleteTableModal) ──────────────── */}
      <Dialog open={restoreOpen} onOpenChange={setRestoreOpen}>
        <DialogContent
          className="max-w-md p-0 gap-0 overflow-hidden"
          onEscapeKeyDown={(e) => isLoading && e.preventDefault()}
          onPointerDownOutside={(e) => isLoading && e.preventDefault()}
        >
          {/* Header */}
          <div className="px-5 py-4 border-b border-default">
            <DialogTitle className="text-sm font-medium pr-6 flex items-center gap-2">
              <RotateCcw className="h-4 w-4 text-amber-500 shrink-0" />
              Confirm restore of backup &quot;{targetBackup?.name}&quot;
            </DialogTitle>
          </div>

          {/* Body */}
          <div className="px-5 py-4 space-y-4">
            <DialogDescription className="text-sm text-foreground-light leading-relaxed">
              Are you sure you want to restore the database to backup snapshot <span className="font-mono font-medium text-foreground">&quot;{targetBackup?.name}&quot;</span>? Current active database tables and schemas will be replaced with the state captured on <span className="font-mono text-foreground font-medium">{targetBackup?.createdAt}</span>. This action cannot be undone.
            </DialogDescription>
          </div>

          {/* Footer */}
          <div className="px-5 py-4 border-t border-default grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant="default"
              size="large"
              disabled={isLoading}
              onClick={() => setRestoreOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="warning"
              size="large"
              loading={isLoading}
              onClick={handleRestore}
            >
              {isLoading ? 'Restoring...' : 'Restore backup'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ──────────────── Delete Confirmation Dialog (matches DeleteTableModal) ──────────────── */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent
          className="max-w-md p-0 gap-0 overflow-hidden"
          onEscapeKeyDown={(e) => isLoading && e.preventDefault()}
          onPointerDownOutside={(e) => isLoading && e.preventDefault()}
        >
          {/* Header */}
          <div className="px-5 py-4 border-b border-default">
            <DialogTitle className="text-sm font-medium pr-6 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
              Confirm deletion of backup &quot;{targetBackup?.name}&quot;
            </DialogTitle>
          </div>

          {/* Body */}
          <div className="px-5 py-4 space-y-4">
            <DialogDescription className="text-sm text-foreground-light leading-relaxed">
              Are you sure you want to delete the backup <span className="font-mono font-medium text-foreground">&quot;{targetBackup?.name}&quot;</span>? This action cannot be undone and this snapshot will be permanently removed.
            </DialogDescription>
          </div>

          {/* Footer */}
          <div className="px-5 py-4 border-t border-default grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant="default"
              size="large"
              disabled={isLoading}
              onClick={() => setDeleteOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="large"
              loading={isLoading}
              onClick={handleDelete}
            >
              {isLoading ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ──────────────── Toast ──────────────── */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-3 rounded-lg border border-strong bg-surface-100 p-3.5 text-xs text-foreground shadow-2xl transition-all duration-300 animate-in fade-in slide-in-from-bottom-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-surface-200 text-foreground border border-strong shrink-0">
            <Check className="h-3.5 w-3.5" />
          </div>
          <div className="pr-2">
            <div className="font-semibold text-foreground">Success</div>
            <div className="text-[11px] text-foreground-lighter mt-0.5">{toastMessage}</div>
          </div>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-foreground-lighter hover:text-foreground p-1 transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  )
}
