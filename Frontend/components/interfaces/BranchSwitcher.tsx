'use client'

import React, { useState, useEffect } from 'react'
import {
  GitBranch,
  Search,
  Plus,
  Check,
  ChevronsUpDown,
  Loader2,
  X,
} from 'lucide-react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'

export type BranchTag = string

export interface Branch {
  id: string
  name: string
  tag: BranchTag
  isDefault?: boolean
}

const DEFAULT_BRANCHES: Branch[] = [
  { id: 'b_main', name: 'main', tag: 'production', isDefault: true },
  { id: 'b_staging', name: 'staging', tag: 'staging' },
  { id: 'b_dev', name: 'dev', tag: 'dev' },
  { id: 'b_preview', name: 'preview', tag: 'preview' },
  { id: 'b_testing', name: 'testing', tag: 'testing' },
  { id: 'b_feature', name: 'feature/auth-v2', tag: 'dev' },
]

function getTagBadgeStyle(tag: BranchTag) {
  const t = tag.toLowerCase()
  if (t === 'production' || t === 'prod') {
    return 'border-amber-500/40 text-amber-500 bg-amber-500/10'
  }
  return 'border-strong text-foreground-lighter bg-surface-200'
}

export function BranchSwitcher() {
  const [branches, setBranches] = useState<Branch[]>(DEFAULT_BRANCHES)
  const [activeBranchId, setActiveBranchId] = useState<string>('b_main')
  const [search, setSearch] = useState('')
  const [popoverOpen, setPopoverOpen] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)

  // Create branch modal state
  const [newBranchName, setNewBranchName] = useState('')
  const [selectedTag, setSelectedTag] = useState<string>('dev')
  const [isCreating, setIsCreating] = useState(false)

  // Toast state
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  // Load persisted branches & active branch from localStorage
  useEffect(() => {
    try {
      const savedBranches = localStorage.getItem('pgbase_branches')
      if (savedBranches) {
        const parsed = JSON.parse(savedBranches)
        if (Array.isArray(parsed) && parsed.length > 0) {
          setBranches(parsed)
        }
      }

      const savedActive = localStorage.getItem('pgbase_active_branch_id')
      if (savedActive) {
        setActiveBranchId(savedActive)
      }
    } catch (e) {
      // Ignore storage errors
    }
  }, [])

  // Persist branches helper
  const saveBranches = (newBranches: Branch[]) => {
    setBranches(newBranches)
    try {
      localStorage.setItem('pgbase_branches', JSON.stringify(newBranches))
    } catch (e) {}
  }

  const selectBranch = (branch: Branch) => {
    setActiveBranchId(branch.id)
    try {
      localStorage.setItem('pgbase_active_branch_id', branch.id)
    } catch (e) {}
    setPopoverOpen(false)
  }

  // Handle branch creation
  const handleCreateBranch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newBranchName.trim() || isCreating) return

    setIsCreating(true)

    // Simulate async branch provisioning
    await new Promise((resolve) => setTimeout(resolve, 800))

    const newBranch: Branch = {
      id: `b_${Date.now()}`,
      name: newBranchName.trim(),
      tag: selectedTag.trim() || 'dev',
    }

    const updated = [...branches, newBranch]
    saveBranches(updated)
    setActiveBranchId(newBranch.id)
    try {
      localStorage.setItem('pgbase_active_branch_id', newBranch.id)
    } catch (e) {}

    setIsCreating(false)
    setDialogOpen(false)
    setNewBranchName('')
    setSelectedTag('dev')

    // Show toast notification
    setToastMessage(`Branch "${newBranch.name}" created successfully`)
    setTimeout(() => {
      setToastMessage(null)
    }, 4000)
  }

  const activeBranch = branches.find((b) => b.id === activeBranchId) || branches[0]



  const filteredBranches = branches.filter((b) =>
    b.name.toLowerCase().includes(search.toLowerCase()) ||
    b.tag.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <>
      {/* Branch Dropdown Trigger */}
      <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="flex items-center gap-1.5 hover:bg-surface-200 px-2 py-1 rounded-md cursor-pointer transition-colors outline-none select-none"
          >
            <GitBranch className="h-3.5 w-3.5 text-foreground-lighter" />
            <span className="font-medium text-foreground">{activeBranch.name}</span>
            <span
              className={`text-[10px] uppercase tracking-wide font-medium border rounded-full px-2 py-0.5 ml-1 ${getTagBadgeStyle(
                activeBranch.tag
              )}`}
            >
              {activeBranch.tag}
            </span>
            <ChevronsUpDown className="h-3.5 w-3.5 text-foreground-muted ml-0.5" />
          </button>
        </PopoverTrigger>

        {/* Dropdown Popover Content */}
        <PopoverContent
          align="start"
          sideOffset={6}
          className="w-72 p-0 shadow-2xl border-default bg-surface-100 rounded-md overflow-hidden text-foreground"
        >
          {/* Upper: Search Input */}
          <div className="p-2 border-b border-default bg-surface-75/40">
            <Input
              placeholder="Search branches..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-surface-200 border-strong h-8 text-xs text-foreground placeholder:text-foreground-muted focus-visible:ring-1 focus-visible:ring-strong focus-visible:border-strong"
              iconLeft={<Search className="h-3.5 w-3.5 text-foreground-lighter" />}
            />
          </div>

          {/* Upper: Branch List */}
          <div className="p-1">
            <div className="px-2 py-1 text-[11px] font-medium text-foreground-lighter">
              Branches ({filteredBranches.length})
            </div>
            <div className="max-h-[175px] overflow-y-auto space-y-0.5 pr-1">
              {filteredBranches.length > 0 ? (
                filteredBranches.map((branch) => {
                  const isSelected = branch.id === activeBranchId
                  return (
                    <div
                      key={branch.id}
                      onClick={() => selectBranch(branch)}
                      className={`px-2 py-1.5 h-[34px] text-xs rounded-md flex items-center justify-between cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-surface-200 text-foreground font-medium'
                          : 'text-foreground-light hover:bg-surface-200 hover:text-foreground'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <GitBranch className="h-3.5 w-3.5 text-foreground-lighter shrink-0" />
                        <span className="truncate">{branch.name}</span>
                        <span
                          className={`text-[9px] uppercase tracking-wider font-medium border rounded-full px-1.5 py-0.2 shrink-0 ${getTagBadgeStyle(
                            branch.tag
                          )}`}
                        >
                          {branch.tag}
                        </span>
                      </div>

                      {isSelected && (
                        <Check className="h-3.5 w-3.5 text-foreground shrink-0 ml-2" />
                      )}
                    </div>
                  )
                })
              ) : (
                <div className="px-2 py-4 text-xs text-foreground-lighter text-center">
                  No branches found matching "{search}"
                </div>
              )}
            </div>
          </div>

          {/* Down: Create New Branch Button */}
          <div className="p-1.5 border-t border-default bg-surface-75/60">
            <button
              type="button"
              onClick={() => {
                setPopoverOpen(false)
                setDialogOpen(true)
              }}
              className="w-full flex items-center justify-center gap-2 py-1.5 px-3 text-xs font-medium text-foreground bg-surface-200 hover:bg-surface-300 border border-strong rounded-md transition-colors shadow-2xs"
            >
              <Plus className="h-3.5 w-3.5 text-foreground-lighter" />
              Create new branch
            </button>
          </div>
        </PopoverContent>
      </Popover>

      {/* Create New Branch Dialog Modal */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md p-6 bg-surface-100 border-default text-foreground shadow-2xl rounded-lg">
          <form onSubmit={handleCreateBranch}>
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
              {/* Branch Name Field */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">
                  Branch name <span className="text-destructive">*</span>
                </label>
                <Input
                  placeholder="e.g. staging, feature/auth, test-db"
                  value={newBranchName}
                  onChange={(e) => setNewBranchName(e.target.value)}
                  disabled={isCreating}
                  required
                  autoFocus
                  className="bg-surface-200 border-strong text-foreground placeholder:text-foreground-muted text-xs h-9 focus-visible:ring-1 focus-visible:ring-strong focus-visible:border-strong"
                />
              </div>

              {/* Environment tag */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">
                  Environment tag
                </label>
                <Input
                  placeholder="e.g. dev, staging, production"
                  value={selectedTag}
                  onChange={(e) => setSelectedTag(e.target.value)}
                  disabled={isCreating}
                  className="bg-surface-200 border-strong text-foreground placeholder:text-foreground-muted text-xs h-9 focus-visible:ring-1 focus-visible:ring-strong focus-visible:border-strong"
                />
              </div>


            </div>

            <DialogFooter className="pt-3 border-t border-default flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setDialogOpen(false)}
                disabled={isCreating}
                className="px-3 py-1.5 text-xs font-medium text-foreground-lighter hover:text-foreground hover:bg-surface-200 rounded-md transition-colors"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={!newBranchName.trim() || isCreating}
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-foreground bg-surface-300 hover:bg-surface-200 disabled:opacity-50 disabled:pointer-events-none border border-strong rounded-md transition-colors shadow-xs"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-foreground" />
                    Creating branch...
                  </>
                ) : (
                  'Create branch'
                )}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-3 rounded-lg border border-strong bg-surface-100 p-3.5 text-xs text-foreground shadow-2xl transition-all duration-300 animate-in fade-in slide-in-from-bottom-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-surface-200 text-foreground border border-strong shrink-0">
            <Check className="h-3.5 w-3.5" />
          </div>
          <div className="pr-2">
            <div className="font-semibold text-foreground">Branch Created</div>
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
    </>
  )
}
