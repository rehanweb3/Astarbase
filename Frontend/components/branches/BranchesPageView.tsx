'use client'

import React, { useState, useEffect } from 'react'
import {
  GitBranch,
  Plus,
  MoreHorizontal,
  Pencil,
  RotateCcw,
  Trash2,
  Loader2,
  AlertTriangle,
  Check,
  X,
  HardDrive,
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
import type { Branch, BranchTag } from '@/components/interfaces/BranchSwitcher'

// ─── Tag badge styling ────────────────────────────────────────────
function getTagBadgeStyle(tag: BranchTag) {
  const t = tag.toLowerCase()
  if (t === 'production' || t === 'prod') {
    return 'border-amber-500/40 text-amber-500 bg-amber-500/10'
  }
  if (t === 'staging') {
    return 'border-blue-500/40 text-blue-500 bg-blue-500/10'
  }
  if (t === 'preview') {
    return 'border-purple-500/40 text-purple-500 bg-purple-500/10'
  }
  return 'border-strong text-foreground-lighter bg-surface-200'
}

// ─── Mock storage sizes for branches ──────────────────────────────
function getMockStorage(id: string) {
  const sizes: Record<string, string> = {
    b_main: '42.8 MB',
    b_staging: '38.2 MB',
    b_dev: '12.4 MB',
    b_preview: '8.1 MB',
    b_testing: '5.6 MB',
    b_feature: '3.2 MB',
  }
  return sizes[id] || `${(Math.random() * 20 + 1).toFixed(1)} MB`
}

// ─── Mock created dates ───────────────────────────────────────────
function getMockDate(id: string) {
  const dates: Record<string, string> = {
    b_main: '2024-01-15',
    b_staging: '2024-03-22',
    b_dev: '2024-06-10',
    b_preview: '2024-08-05',
    b_testing: '2024-09-18',
    b_feature: '2024-11-02',
  }
  return dates[id] || new Date().toISOString().split('T')[0]
}

const DEFAULT_BRANCHES: Branch[] = [
  { id: 'b_main', name: 'main', tag: 'production', isDefault: true },
  { id: 'b_staging', name: 'staging', tag: 'staging' },
  { id: 'b_dev', name: 'dev', tag: 'dev' },
  { id: 'b_preview', name: 'preview', tag: 'preview' },
  { id: 'b_testing', name: 'testing', tag: 'testing' },
  { id: 'b_feature', name: 'feature/auth-v2', tag: 'dev' },
]

export function BranchesPageView() {
  const [branches, setBranches] = useState<Branch[]>(DEFAULT_BRANCHES)

  // Dialog states
  const [createOpen, setCreateOpen] = useState(false)
  const [renameOpen, setRenameOpen] = useState(false)
  const [resetOpen, setResetOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  // Target branch for actions
  const [targetBranch, setTargetBranch] = useState<Branch | null>(null)

  // Form states
  const [newBranchName, setNewBranchName] = useState('')
  const [newBranchTag, setNewBranchTag] = useState('dev')
  const [renameTo, setRenameTo] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  // Load from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('pgbase_branches')
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length > 0) {
          setBranches(parsed)
        }
      }
    } catch (e) {}
  }, [])

  const saveBranches = (updated: Branch[]) => {
    setBranches(updated)
    try {
      localStorage.setItem('pgbase_branches', JSON.stringify(updated))
    } catch (e) {}
  }

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 4000)
  }

  // ─── Create ──────────────────────────────────────────────
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newBranchName.trim() || isLoading) return
    setIsLoading(true)
    await new Promise((r) => setTimeout(r, 700))

    const newBranch: Branch = {
      id: `b_${Date.now()}`,
      name: newBranchName.trim(),
      tag: newBranchTag.trim() || 'dev',
    }
    saveBranches([...branches, newBranch])
    setIsLoading(false)
    setCreateOpen(false)
    setNewBranchName('')
    setNewBranchTag('dev')
    showToast(`Branch "${newBranch.name}" created successfully`)
  }

  // ─── Rename ──────────────────────────────────────────────
  const handleRename = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!targetBranch || !renameTo.trim() || isLoading) return
    setIsLoading(true)
    await new Promise((r) => setTimeout(r, 500))

    const updated = branches.map((b) =>
      b.id === targetBranch.id ? { ...b, name: renameTo.trim() } : b
    )
    saveBranches(updated)
    setIsLoading(false)
    setRenameOpen(false)
    showToast(`Branch renamed to "${renameTo.trim()}"`)
    setRenameTo('')
    setTargetBranch(null)
  }

  // ─── Reset ───────────────────────────────────────────────
  const handleReset = async () => {
    if (!targetBranch || isLoading) return
    setIsLoading(true)
    await new Promise((r) => setTimeout(r, 800))
    setIsLoading(false)
    setResetOpen(false)
    showToast(`Branch "${targetBranch.name}" has been reset`)
    setTargetBranch(null)
  }

  // ─── Delete ──────────────────────────────────────────────
  const handleDelete = async () => {
    if (!targetBranch || isLoading) return
    setIsLoading(true)
    await new Promise((r) => setTimeout(r, 600))

    const updated = branches.filter((b) => b.id !== targetBranch.id)
    if (targetBranch.isDefault && updated.length > 0) {
      updated[0].isDefault = true
    }
    saveBranches(updated)
    setIsLoading(false)
    setDeleteOpen(false)
    showToast(`Branch "${targetBranch.name}" deleted successfully.`)
    setTargetBranch(null)
  }

  return (
    <div className="flex-1 overflow-y-auto bg-studio p-6 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-default">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground flex items-center gap-2.5">
            <GitBranch className="h-5 w-5 text-foreground-lighter" />
            Branches
          </h1>
          <p className="text-sm text-foreground-lighter mt-1">
            Manage database branches for safe schema development and testing.
          </p>
        </div>
        <Button
          variant="primary"
          size="small"
          iconLeft={<Plus className="h-3.5 w-3.5" />}
          onClick={() => setCreateOpen(true)}
          className="gap-1.5 font-medium shadow-xs"
        >
          Create branch
        </Button>
      </div>

      {/* Branches Table */}
      <div className="rounded-lg border border-default overflow-hidden">
        {/* Table Header */}
        <div className="grid grid-cols-[2fr_1fr_1fr_1fr_48px] bg-surface-200/60 border-b border-default px-4 py-2.5">
          <span className="text-[11px] font-medium uppercase tracking-wider text-foreground-lighter">
            Branch name
          </span>
          <span className="text-[11px] font-medium uppercase tracking-wider text-foreground-lighter">
            Tag
          </span>
          <span className="text-[11px] font-medium uppercase tracking-wider text-foreground-lighter">
            Storage
          </span>
          <span className="text-[11px] font-medium uppercase tracking-wider text-foreground-lighter">
            Created
          </span>
          <span />
        </div>

        {/* Table Rows */}
        {branches.map((branch) => (
          <div
            key={branch.id}
            className="grid grid-cols-[2fr_1fr_1fr_1fr_48px] items-center px-4 py-3 border-b border-default last:border-b-0 hover:bg-surface-200/40 transition-colors group"
          >
            {/* Branch Name */}
            <div className="flex items-center gap-2.5 min-w-0">
              <GitBranch className="h-3.5 w-3.5 text-foreground-lighter shrink-0" />
              <span className="text-sm font-medium text-foreground truncate">
                {branch.name}
              </span>
              {branch.isDefault && (
                <span className="text-[9px] uppercase tracking-wider font-semibold border border-strong rounded-full px-1.5 py-0.5 text-foreground-lighter shrink-0">
                  default
                </span>
              )}
            </div>

            {/* Tag */}
            <div>
              <span
                className={`text-[10px] uppercase tracking-wider font-medium border rounded-full px-2 py-0.5 ${getTagBadgeStyle(
                  branch.tag
                )}`}
              >
                {branch.tag}
              </span>
            </div>

            {/* Storage */}
            <div className="flex items-center gap-1.5 text-sm text-foreground-light">
              <HardDrive className="h-3 w-3 text-foreground-muted" />
              <span className="font-mono text-xs">{getMockStorage(branch.id)}</span>
            </div>

            {/* Created */}
            <span className="text-xs text-foreground-lighter font-mono">
              {getMockDate(branch.id)}
            </span>

            {/* Actions */}
            <div className="flex justify-end">
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
                  className="w-40 bg-surface-100 border-default text-foreground shadow-xl"
                >
                  <DropdownMenuItem
                    className="text-xs gap-2 cursor-pointer"
                    onSelect={() => {
                      setTargetBranch(branch)
                      setRenameTo(branch.name)
                      setRenameOpen(true)
                    }}
                  >
                    <Pencil className="h-3.5 w-3.5 text-foreground-lighter" />
                    Rename
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-border-muted" />
                  <DropdownMenuItem
                    className="text-xs gap-2 cursor-pointer"
                    onSelect={() => {
                      setTargetBranch(branch)
                      setResetOpen(true)
                    }}
                  >
                    <RotateCcw className="h-3.5 w-3.5 text-foreground-lighter" />
                    Reset
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-xs gap-2 text-destructive focus:text-destructive cursor-pointer"
                    onSelect={() => {
                      setTargetBranch(branch)
                      setDeleteOpen(true)
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        ))}

        {branches.length === 0 && (
          <div className="px-4 py-12 text-center text-sm text-foreground-lighter">
            No branches found. Create your first branch to get started.
          </div>
        )}
      </div>

      {/* ──────────────── Create Branch Dialog ──────────────── */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md p-6 bg-surface-100 border-default text-foreground shadow-2xl rounded-lg">
          <form onSubmit={handleCreate}>
            <DialogHeader className="pb-3 border-b border-default text-left">
              <DialogTitle className="text-base font-semibold text-foreground flex items-center gap-2">
                <GitBranch className="h-4 w-4 text-foreground-lighter" />
                Create new branch
              </DialogTitle>
              <DialogDescription className="text-xs text-foreground-lighter mt-1">
                Branch your database to safely develop schema changes or test migrations.
              </DialogDescription>
            </DialogHeader>

            <div className="py-4 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">
                  Branch name <span className="text-destructive">*</span>
                </label>
                <Input
                  placeholder="e.g. staging, feature/auth, test-db"
                  value={newBranchName}
                  onChange={(e) => setNewBranchName(e.target.value)}
                  disabled={isLoading}
                  required
                  autoFocus
                  className="bg-surface-200 border-strong text-foreground placeholder:text-foreground-muted text-xs h-9 focus-visible:ring-1 focus-visible:ring-strong focus-visible:border-strong"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">
                  Environment tag
                </label>
                <Input
                  placeholder="e.g. dev, staging, production"
                  value={newBranchTag}
                  onChange={(e) => setNewBranchTag(e.target.value)}
                  disabled={isLoading}
                  className="bg-surface-200 border-strong text-foreground placeholder:text-foreground-muted text-xs h-9 focus-visible:ring-1 focus-visible:ring-strong focus-visible:border-strong"
                />
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
                disabled={!newBranchName.trim() || isLoading}
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-foreground bg-surface-300 hover:bg-surface-200 disabled:opacity-50 disabled:pointer-events-none border border-strong rounded-md transition-colors shadow-xs"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create branch'
                )}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ──────────────── Rename Dialog ──────────────── */}
      <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
        <DialogContent className="max-w-md p-6 bg-surface-100 border-default text-foreground shadow-2xl rounded-lg">
          <form onSubmit={handleRename}>
            <DialogHeader className="pb-3 border-b border-default text-left">
              <DialogTitle className="text-base font-semibold text-foreground flex items-center gap-2">
                <Pencil className="h-4 w-4 text-foreground-lighter" />
                Rename branch
              </DialogTitle>
              <DialogDescription className="text-xs text-foreground-lighter mt-1">
                Rename <span className="font-mono text-foreground">{targetBranch?.name}</span> to a new name.
              </DialogDescription>
            </DialogHeader>

            <div className="py-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">
                  New branch name <span className="text-destructive">*</span>
                </label>
                <Input
                  placeholder="Enter new branch name"
                  value={renameTo}
                  onChange={(e) => setRenameTo(e.target.value)}
                  disabled={isLoading}
                  required
                  autoFocus
                  className="bg-surface-200 border-strong text-foreground placeholder:text-foreground-muted text-xs h-9 focus-visible:ring-1 focus-visible:ring-strong focus-visible:border-strong"
                />
              </div>
            </div>

            <DialogFooter className="pt-3 border-t border-default flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setRenameOpen(false)}
                disabled={isLoading}
                className="px-3 py-1.5 text-xs font-medium text-foreground-lighter hover:text-foreground hover:bg-surface-200 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!renameTo.trim() || isLoading}
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-foreground bg-surface-300 hover:bg-surface-200 disabled:opacity-50 disabled:pointer-events-none border border-strong rounded-md transition-colors shadow-xs"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Renaming...
                  </>
                ) : (
                  'Rename'
                )}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ──────────────── Reset Confirmation Dialog ──────────────── */}
      <Dialog open={resetOpen} onOpenChange={setResetOpen}>
        <DialogContent
          className="max-w-md p-0 gap-0 overflow-hidden"
          onEscapeKeyDown={(e) => isLoading && e.preventDefault()}
          onPointerDownOutside={(e) => isLoading && e.preventDefault()}
        >
          {/* Header */}
          <div className="px-5 py-4 border-b border-default">
            <DialogTitle className="text-sm font-medium pr-6 flex items-center gap-2">
              <RotateCcw className="h-4 w-4 text-amber-500 shrink-0" />
              Confirm reset of branch &quot;{targetBranch?.name}&quot;
            </DialogTitle>
          </div>

          {/* Body */}
          <div className="px-5 py-4 space-y-4">
            <DialogDescription className="text-sm text-foreground-light leading-relaxed">
              Are you sure you want to reset the branch <span className="font-mono font-medium text-foreground">&quot;{targetBranch?.name}&quot;</span>? This will discard all uncommitted schema changes and restore it to its base state. This action cannot be undone.
            </DialogDescription>
          </div>

          {/* Footer */}
          <div className="px-5 py-4 border-t border-default grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant="default"
              size="large"
              disabled={isLoading}
              onClick={() => setResetOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="warning"
              size="large"
              loading={isLoading}
              onClick={handleReset}
            >
              {isLoading ? 'Resetting...' : 'Reset'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ──────────────── Delete Confirmation Dialog ──────────────── */}
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
              Confirm deletion of branch &quot;{targetBranch?.name}&quot;
            </DialogTitle>
          </div>

          {/* Body */}
          <div className="px-5 py-4 space-y-4">
            <DialogDescription className="text-sm text-foreground-light leading-relaxed">
              Are you sure you want to delete the branch <span className="font-mono font-medium text-foreground">&quot;{targetBranch?.name}&quot;</span>? This action cannot be undone and all associated schema changes and data will be permanently removed.
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
