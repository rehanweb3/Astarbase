'use client'

import React, { useState } from 'react'
import { Search, Shield, BookOpen, ChevronDown, Table as TableIcon, Lock } from 'lucide-react'
import { AppLayout } from '@/components/layouts/AppLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'

export default function PoliciesPage() {
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const [command, setCommand] = useState('DELETE')

  return (
    <AppLayout headerTitle="Authentication">
      <div className="flex-1 w-full h-full p-8 md:p-12 overflow-y-auto">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-medium text-foreground">Policies</h1>
              <p className="text-base text-foreground-lighter mt-1">
                Manage Row Level Security policies for your tables
              </p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center pt-4">
            <Input 
              placeholder="Search..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 bg-studio border-default text-sm rounded-md w-64"
              iconLeft={<Search className="h-4 w-4" />}
            />
          </div>

          {/* Table List */}
          <div className="border border-default bg-studio rounded-lg overflow-hidden mt-4">
            {/* Table Header Row */}
            <div className="flex items-center justify-between p-4 border-b border-default bg-studio">
              <div className="flex items-center gap-3">
                <TableIcon className="h-5 w-5 text-foreground-lighter" />
                <span className="font-medium text-foreground">fggfgffg</span>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="default" size="small">Disable RLS</Button>
                
                {/* Create Policy Sheet */}
                <Sheet open={open} onOpenChange={setOpen}>
                  <SheetTrigger asChild>
                    <Button variant="default" size="small">Create policy</Button>
                  </SheetTrigger>
                  <SheetContent className="w-full sm:max-w-2xl p-0 overflow-hidden flex flex-col">
                    <SheetHeader>
                      <SheetTitle>Create a new Row Level Security policy</SheetTitle>
                    </SheetHeader>
                    <div className="p-6 flex-1 overflow-y-auto space-y-6">
                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-sm text-foreground-lighter">Policy Name</label>
                          <Input defaultValue="Enable delete for users based on user_id" className="bg-surface-100 border-default h-10" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm text-foreground-lighter">Table <span className="px-1.5 py-0.5 rounded-md bg-surface-200 border border-strong text-xs">on</span> clause</label>
                          <div className="flex items-center justify-between px-3 h-10 border border-default rounded-md bg-surface-100 text-sm">
                            <span>public.jfld</span>
                            <ChevronDown className="h-4 w-4 text-foreground-muted" />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm text-foreground-lighter">Policy Behavior <span className="px-1.5 py-0.5 rounded-md bg-surface-200 border border-strong text-xs">as</span> clause</label>
                        <div className="w-1/2 flex items-center justify-between px-3 h-10 border border-default rounded-md bg-surface-100 text-sm">
                          <span>Permissive</span>
                          <ChevronDown className="h-4 w-4 text-foreground-muted" />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm text-foreground-lighter">Policy Command <span className="px-1.5 py-0.5 rounded-md bg-surface-200 border border-strong text-xs">for</span> clause</label>
                        <div className="flex items-center gap-2">
                          {['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'ALL'].map(cmd => (
                            <button
                              key={cmd}
                              type="button"
                              onClick={() => setCommand(cmd)}
                              className={`flex items-center gap-2 px-3 py-1.5 rounded-md border text-sm transition-colors ${
                                command === cmd 
                                  ? 'bg-surface-200 border-strong text-foreground' 
                                  : 'bg-surface-100 border-default text-foreground-lighter hover:border-strong'
                              }`}
                            >
                              <div className={`h-3.5 w-3.5 rounded-full border flex items-center justify-center ${command === cmd ? 'border-foreground' : 'border-strong'}`}>
                                {command === cmd && <div className="h-2 w-2 rounded-full bg-foreground" />}
                              </div>
                              {cmd}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm text-foreground-lighter">Target Roles <span className="px-1.5 py-0.5 rounded-md bg-surface-200 border border-strong text-xs">to</span> clause</label>
                        <Input placeholder="Defaults to all (public) roles if none selected" className="bg-surface-100 border-default h-10" />
                      </div>

                      <div className="mt-8 border border-default rounded-md bg-surface-200 overflow-hidden text-sm font-mono leading-relaxed">
                        <div className="flex items-center gap-2 px-4 py-2 border-b border-default bg-surface-100 text-xs text-foreground-muted font-sans uppercase tracking-wider">
                          <Lock className="h-3.5 w-3.5" />
                          <span>Use options above to edit</span>
                        </div>
                        <div className="p-4 overflow-x-auto text-foreground-light whitespace-pre">
                          <span className="text-foreground-muted mr-4 select-none">1</span><span className="text-brand-500">create</span> policy "Enable delete for users based on user_id"<br/>
                          <span className="text-foreground-muted mr-4 select-none">2</span><span className="text-brand-500">on</span> "public"."jfld"<br/>
                          <span className="text-foreground-muted mr-4 select-none">3</span><span className="text-brand-500">as</span> PERMISSIVE<br/>
                          <span className="text-foreground-muted mr-4 select-none">4</span><span className="text-brand-500">for</span> {command}<br/>
                          <span className="text-foreground-muted mr-4 select-none">5</span><span className="text-brand-500">to</span> public<br/>
                          <span className="text-foreground-muted mr-4 select-none">6</span><span className="text-brand-500">using</span> (<br/>
                          <div className="bg-surface-300 -mx-4 px-4 py-0.5"><span className="text-brand-500 mr-4 font-bold select-none">7</span>    <span className="text-blue-500">(select</span> auth.uid()<span className="text-blue-500">)</span> = user_id</div>
                          <span className="text-foreground-muted mr-4 select-none">8</span>);
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-4 border-t border-default bg-surface-100 flex items-center justify-end gap-2">
                      <Button variant="default" onClick={() => setOpen(false)}>Cancel</Button>
                      <Button variant="primary">Save policy</Button>
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            </div>

            {/* Empty States */}
            <div className="p-4 border-b border-default text-sm text-foreground-lighter bg-studio">
              No data will be returned via the Data API as no RLS policies exist on this table.
            </div>
            <div className="p-4 text-sm text-foreground-lighter bg-studio">
              No policies created yet
            </div>
          </div>

        </div>
      </div>
    </AppLayout>
  )
}
