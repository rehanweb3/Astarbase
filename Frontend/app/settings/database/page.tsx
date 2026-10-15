'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { BookOpen, AlertTriangle } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogHeader,
  DialogFooter,
} from '@/components/ui/dialog'
import { useRouter } from 'next/navigation'

export default function DatabaseSettingsPage() {
  const router = useRouter()
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)

  const [isResetOpen, setIsResetOpen] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [isResetting, setIsResetting] = useState(false)

  const handleResetPassword = () => {
    setIsResetting(true)
    setTimeout(() => {
      setIsResetting(false)
      setIsResetOpen(false)
      setNewPassword('')
    }, 1000)
  }

  const handleDeleteDatabase = () => {
    setIsDeleting(true)
    setTimeout(() => {
      setIsDeleting(false)
      setIsDeleteOpen(false)
      router.push('/new') // Redirects to dashboard/new project
    }, 1500)
  }

  return (
    <div className="max-w-4xl mx-auto p-12">
      <div className="mb-10">
        <h1 className="text-2xl font-medium text-foreground mb-1">Database Settings</h1>
        <p className="text-foreground-lighter">Connections, security, and network configuration</p>
      </div>

      <div className="space-y-12">
        {/* Database password section */}
        <section>
          <div className="mb-4">
            <h2 className="text-xl font-medium text-foreground mb-1">Database password</h2>
            <p className="text-sm text-foreground-lighter">Used for direct Postgres connections</p>
          </div>
          <div className="border border-default bg-studio rounded-xl overflow-hidden">
            <div className="p-6 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-foreground mb-1">Reset database password</h3>
                <p className="text-sm text-foreground-lighter">
                  The database password isn't viewable after creation.<br />
                  Resetting it will break any existing connections.
                </p>
              </div>
              <Button variant="default" onClick={() => setIsResetOpen(true)}>Reset password</Button>
            </div>
          </div>
        </section>

        {/* Connection pooling section */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-medium text-foreground">Connection pooling</h2>
            <Button variant="default" size="small" iconLeft={<BookOpen className="h-4 w-4" />}>
              Docs
            </Button>
          </div>
          <div className="border border-default bg-studio rounded-xl overflow-hidden">
            <div className="p-6 border-b border-default flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-foreground mb-1">Connection poolers</h3>
                <p className="text-sm text-foreground-lighter">
                  Configuration is shared across all connection poolers.
                </p>
              </div>
              <span className="px-2 py-0.5 rounded-full border border-default text-[10px] font-bold text-foreground-muted tracking-wider uppercase">
                Shared
              </span>
            </div>
            
            <div className="p-6 border-b border-default flex gap-8">
              <div className="flex-1">
                <h3 className="text-sm font-medium text-foreground mb-1">Connection pool size</h3>
                <p className="text-sm text-foreground-lighter">
                  The maximum number of connections made to the underlying Postgres cluster, per user+db combination. Pool size has a default of 15 based on your compute size of Nano.
                </p>
              </div>
              <div className="w-64">
                <div className="relative">
                  <Input defaultValue="15" className="pr-24" />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-foreground-lighter">
                    connections
                  </span>
                </div>
              </div>
            </div>

            <div className="p-6 border-b border-default flex gap-8">
              <div className="flex-1">
                <h3 className="text-sm font-medium text-foreground mb-1">Max client connections</h3>
                <p className="text-sm text-foreground-lighter">
                  The maximum number of concurrent client connections allowed. This value is fixed at 200 based on your compute size of Nano and cannot be changed. <a href="#" className="underline text-foreground">Learn more</a>
                </p>
              </div>
              <div className="w-64">
                <div className="relative">
                  <Input defaultValue="200" disabled className="pr-16" />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-foreground-lighter">
                    clients
                  </span>
                </div>
              </div>
            </div>

            <div className="p-4 flex items-center justify-end gap-2 bg-studio">
              <Button variant="default">Cancel</Button>
              <Button variant="primary">Save</Button>
            </div>
          </div>
        </section>

        {/* Danger Zone */}
        <section>
          <div className="mb-4">
            <h2 className="text-xl font-medium text-red-500 mb-1">Danger Zone</h2>
            <p className="text-sm text-foreground-lighter">Destructive actions for this database</p>
          </div>
          <div className="border border-red-500/30 bg-red-500/5 rounded-xl overflow-hidden">
            <div className="p-6 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-foreground mb-1">Delete database</h3>
                <p className="text-sm text-foreground-lighter">
                  Permanently delete this database and all of its data. This action cannot be undone.
                </p>
              </div>
              <Button 
                variant="default" 
                className="bg-red-500 hover:bg-red-600 text-white border-none"
                onClick={() => {
                  setDeleteConfirmText('')
                  setIsDeleteOpen(true)
                }}
              >
                Delete database
              </Button>
            </div>
          </div>
        </section>
      </div>

      {/* Delete Database Modal */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Database</DialogTitle>
            <DialogDescription>
              This action is irreversible. It will permanently delete all data, schemas, and policies.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-foreground-light mb-2">
              Please type <span className="font-bold text-foreground">I Confirm Delete</span> to confirm.
            </p>
            <Input 
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="I Confirm Delete"
            />
          </div>
          <DialogFooter>
            <Button variant="default" onClick={() => setIsDeleteOpen(false)} disabled={isDeleting}>Cancel</Button>
            <Button 
              className="bg-red-500 hover:bg-red-600 text-white border-none"
              disabled={deleteConfirmText !== 'I Confirm Delete'}
              loading={isDeleting}
              onClick={handleDeleteDatabase}
            >
              Confirm Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Password Modal */}
      <Dialog open={isResetOpen} onOpenChange={setIsResetOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Reset database password</DialogTitle>
          </DialogHeader>

          <div className="py-4 space-y-6">
            {/* Warning Alert */}
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 flex gap-3">
              <div className="shrink-0 mt-0.5">
                <div className="h-5 w-5 bg-amber-500 rounded flex items-center justify-center">
                  <AlertTriangle className="h-3.5 w-3.5 text-white" />
                </div>
              </div>
              <div>
                <h4 className="text-sm font-medium text-foreground mb-1">
                  This password is shared across every connection method
                </h4>
                <p className="text-sm text-foreground-lighter leading-relaxed">
                  Resetting it will disconnect the pooler, read replicas, and any app, ORM, or tool still using the old password. Update it everywhere before switching over.
                </p>
              </div>
            </div>

            {/* Input Section */}
            <div>
              <Input
                type="password"
                placeholder="Type in a strong password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="mb-2"
              />
              <p className="text-sm text-foreground-lighter">
                This is the password to your Postgres database, so it must be strong and hard to guess. <a href="#" className="underline">Generate a password</a>.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="default" onClick={() => setIsResetOpen(false)} disabled={isResetting}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleResetPassword} loading={isResetting} disabled={!newPassword}>
              Reset password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
