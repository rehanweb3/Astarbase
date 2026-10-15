'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Code2,
  Database,
  FileCode2,
  Home,
  LayoutDashboard,
  Search,
  Table2 as Table,
} from 'lucide-react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { MOCK_TABLES, MOCK_SQL_SNIPPETS } from '@/lib/mock-data'

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const router = useRouter()

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }
    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  const navigateTo = (path: string) => {
    setOpen(false)
    router.push(path)
  }

  const filteredTables = MOCK_TABLES.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase())
  )

  const filteredSnippets = MOCK_SQL_SNIPPETS.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-2.5 py-1 text-xs text-foreground-lighter bg-surface-100 hover:bg-surface-200 border border-strong rounded-md transition-colors w-48 justify-between cursor-pointer"
      >
        <span className="flex items-center gap-1.5">
          <Search className="h-3.5 w-3.5" />
          <span>Search or jump to...</span>
        </span>
        <kbd className="text-[10px] font-mono bg-surface-200 border border-default px-1 rounded text-foreground-muted">
          ⌘K
        </kbd>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="p-0 overflow-hidden sm:max-w-xl bg-overlay border-overlay">
          <div className="flex items-center border-b border-default px-3 py-2">
            <Search className="h-4 w-4 text-foreground-lighter mr-2 shrink-0" />
            <input
              placeholder="Search sections, tables, SQL queries..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-transparent text-sm text-foreground placeholder:text-foreground-lighter outline-none"
              autoFocus
            />
          </div>

          <div className="max-h-80 overflow-y-auto p-2 space-y-4 text-xs">
            <div>
              <div className="text-[10px] font-medium tracking-wider uppercase text-foreground-lighter px-2 mb-1">
                Navigation
              </div>
              <div className="space-y-0.5">
                <button
                  onClick={() => navigateTo('/')}
                  className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded hover:bg-surface-200 text-foreground text-left transition-colors cursor-pointer"
                >
                  <LayoutDashboard className="h-4 w-4 text-foreground-light" />
                  <span>Dashboard Home</span>
                </button>
                <button
                  onClick={() => navigateTo('/tables')}
                  className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded hover:bg-surface-200 text-foreground text-left transition-colors cursor-pointer"
                >
                  <Table className="h-4 w-4 text-foreground-light" />
                  <span>Table Editor</span>
                </button>
                <button
                  onClick={() => navigateTo('/sql')}
                  className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded hover:bg-surface-200 text-foreground text-left transition-colors cursor-pointer"
                >
                  <Code2 className="h-4 w-4 text-foreground-light" />
                  <span>SQL Editor</span>
                </button>
                <button
                  onClick={() => navigateTo('/visualizer')}
                  className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded hover:bg-surface-200 text-foreground text-left transition-colors cursor-pointer"
                >
                  <Database className="h-4 w-4 text-foreground-light" />
                  <span>Schema Visualizer</span>
                </button>
              </div>
            </div>

            {filteredTables.length > 0 && (
              <div>
                <div className="text-[10px] font-medium tracking-wider uppercase text-foreground-lighter px-2 mb-1">
                  Tables (public)
                </div>
                <div className="space-y-0.5">
                  {filteredTables.map((tbl) => (
                    <button
                      key={tbl.id}
                      onClick={() => navigateTo(`/tables?table=${tbl.name}`)}
                      className="w-full flex items-center justify-between px-2.5 py-1.5 rounded hover:bg-surface-200 text-foreground text-left transition-colors cursor-pointer font-mono"
                    >
                      <span className="flex items-center gap-2">
                        <Table className="h-3.5 w-3.5 text-foreground-lighter" />
                        <span>{tbl.name}</span>
                      </span>
                      <span className="text-[11px] text-foreground-lighter font-sans">
                        {tbl.estimatedRowCount} rows
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {filteredSnippets.length > 0 && (
              <div>
                <div className="text-[10px] font-medium tracking-wider uppercase text-foreground-lighter px-2 mb-1">
                  Saved SQL Snippets
                </div>
                <div className="space-y-0.5">
                  {filteredSnippets.map((snip) => (
                    <button
                      key={snip.id}
                      onClick={() => navigateTo(`/sql?snippet=${snip.id}`)}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded hover:bg-surface-200 text-foreground text-left transition-colors cursor-pointer"
                    >
                      <FileCode2 className="h-3.5 w-3.5 text-brand-500 shrink-0" />
                      <span className="truncate">{snip.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
