'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { MOCK_SQL_SNIPPETS, SqlSnippet, SqlFolder } from '@/lib/mock-data'

// Sub-components
import { SqlSidebar } from '@/components/sql/editor/SqlSidebar'
import { SqlTabBar } from '@/components/sql/editor/SqlTabBar'
import { SqlActionToolbar } from '@/components/sql/editor/SqlActionToolbar'
import { SqlCodeEditor } from '@/components/sql/editor/SqlCodeEditor'
import { SqlResultsPane, QueryResult } from '@/components/sql/result/SqlResultsPane'
import { downloadResultsAsCsv } from '@/components/sql/export/SqlExportUtils'

const INITIAL_FOLDERS: SqlFolder[] = [
  { id: 'folder_1', name: 'Untitled folder', visibility: 'private' },
]

const INITIAL_SNIPPETS: SqlSnippet[] = [
  {
    id: 'query_1',
    name: 'Untitled query',
    description: 'Finds the most engaged users with aggregated counts across posts and comments',
    isFavorite: false,
    visibility: 'private',
    folderId: 'folder_1',
    sql: MOCK_SQL_SNIPPETS[0].sql,
    inserted_at: '2025-02-10T14:22:00Z',
    updated_at: '2025-03-28T09:15:00Z',
  },
]

export function SqlEditorView() {
  const [folders, setFolders] = useState<SqlFolder[]>(INITIAL_FOLDERS)
  const [snippets, setSnippets] = useState<SqlSnippet[]>(INITIAL_SNIPPETS)
  const [search, setSearch] = useState('')
  const [activeSnippetId, setActiveSnippetId] = useState<string>('query_1')
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)

  // Open tabs
  const [openTabIds, setOpenTabIds] = useState<string[]>(['query_1'])

  // Draft changes per snippet
  const [draftSqlMap, setDraftSqlMap] = useState<Record<string, string>>({})

  // Current query in editor
  const activeSnippet =
    snippets.find((s) => s.id === activeSnippetId) || snippets[0]
  const [currentSql, setCurrentSql] = useState<string>(
    INITIAL_SNIPPETS[0]?.sql || 'SELECT * FROM public.users LIMIT 10;'
  )

  // Unsaved snippets tracking
  const unsavedSnippetIds = useMemo(() => {
    const set = new Set<string>()
    Object.entries(draftSqlMap).forEach(([id, sql]) => {
      const snip = snippets.find((s) => s.id === id)
      if (snip && snip.sql !== sql) {
        set.add(id)
      }
    })
    if (activeSnippet && currentSql !== activeSnippet.sql) {
      set.add(activeSnippet.id)
    }
    return set
  }, [draftSqlMap, currentSql, activeSnippet, snippets])

  // Handle SQL changes
  const handleSqlChange = (val: string) => {
    setCurrentSql(val)
    setDraftSqlMap((prev) => ({ ...prev, [activeSnippetId]: val }))
  }

  // Execution state & Results (initially null until query is run)
  const [isExecuting, setIsExecuting] = useState(false)
  const [queryResult, setQueryResult] = useState<QueryResult | null>(null)
  const [activeBottomTab, setActiveBottomTab] = useState<'results' | 'chart'>('results')

  // Switch snippet
  const handleSelectSnippet = (snippet: SqlSnippet) => {
    setActiveSnippetId(snippet.id)
    setCurrentSql(draftSqlMap[snippet.id] ?? snippet.sql)
    if (!openTabIds.includes(snippet.id)) {
      setOpenTabIds([...openTabIds, snippet.id])
    }
  }

  // Create new scratchpad query
  const handleCreateNewQuery = () => {
    const newId = `query_${Date.now()}`
    const newSnippet: SqlSnippet = {
      id: newId,
      name: `Untitled query`,
      sql: `-- Type your SQL query here\nSELECT * FROM public.users LIMIT 10;`,
      inserted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    setSnippets([newSnippet, ...snippets])
    setOpenTabIds([...openTabIds, newId])
    setActiveSnippetId(newId)
    setCurrentSql(newSnippet.sql)
  }

  // Add template as new snippet
  const handleAddTemplate = (snippet: SqlSnippet) => {
    setSnippets([snippet, ...snippets])
    handleSelectSnippet(snippet)
  }

  // Close tab
  const handleCloseTab = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const nextTabs = openTabIds.filter((t) => t !== id)
    setOpenTabIds(nextTabs)
    if (activeSnippetId === id && nextTabs.length > 0) {
      const nextSnippet = snippets.find((s) => s.id === nextTabs[0])
      if (nextSnippet) {
        setActiveSnippetId(nextSnippet.id)
        setCurrentSql(draftSqlMap[nextSnippet.id] ?? nextSnippet.sql)
      }
    }
  }

  // Select tab
  const handleSelectTab = (snippet: SqlSnippet) => {
    setActiveSnippetId(snippet.id)
    setCurrentSql(draftSqlMap[snippet.id] ?? snippet.sql)
  }

  // Run Query
  const handleRunQuery = useCallback(() => {
    setIsExecuting(true)
    setTimeout(() => {
      setIsExecuting(false)
      const sqlLower = currentSql.toLowerCase()

      if (sqlLower.includes('organizations') || sqlLower.includes('org')) {
        setQueryResult({
          columns: ['org_id', 'org_name', 'plan', 'billing_email', 'owner_name', 'owner_email'],
          rows: [
            { org_id: '11111111', org_name: 'Acme Corporation', plan: 'enterprise', billing_email: 'billing@acme.io', owner_name: 'Sophia Chen', owner_email: 'sophia.chen@acme.io' },
            { org_id: '22222222', org_name: 'Venture Labs', plan: 'team', billing_email: 'finance@venture.co', owner_name: 'Alex Morgan', owner_email: 'alex.morgan@venture.co' },
            { org_id: '33333333', org_name: 'CloudScale Networks', plan: 'pro', billing_email: 'accounts@cloudscale.net', owner_name: 'Elena Rostova', owner_email: 'elena.rostova@cloudscale.net' },
          ],
          executionTimeMs: 14,
          rowCount: 3,
          status: 'success',
        })
      } else if (sqlLower.includes('pg_stat') || sqlLower.includes('size')) {
        setQueryResult({
          columns: ['schema', 'table_name', 'estimated_rows', 'total_size', 'table_size', 'index_size'],
          rows: [
            { schema: 'public', table_name: 'posts', estimated_rows: 310, total_size: '18 MB', table_size: '12 MB', index_size: '6 MB' },
            { schema: 'public', table_name: 'users', estimated_rows: 1248, total_size: '8.4 MB', table_size: '5.2 MB', index_size: '3.2 MB' },
            { schema: 'public', table_name: 'comments', estimated_rows: 980, total_size: '6.1 MB', table_size: '4.0 MB', index_size: '2.1 MB' },
            { schema: 'public', table_name: 'organizations', estimated_rows: 48, total_size: '1.2 MB', table_size: '800 kB', index_size: '400 kB' },
          ],
          executionTimeMs: 22,
          rowCount: 4,
          status: 'success',
        })
      } else if (sqlLower.includes('current_user') || sqlLower.includes('user()') || (sqlLower.includes('user') && !sqlLower.includes('posts') && !sqlLower.includes('email'))) {
        setQueryResult({
          columns: ['user'],
          rows: [
            { user: 'postgres' },
          ],
          executionTimeMs: 12,
          rowCount: 1,
          status: 'success',
        })
      } else {
        // Default users table output
        setQueryResult({
          columns: ['id', 'email', 'full_name', 'role', 'is_active', 'created_at'],
          rows: [
            { id: '8a9c27b0-4f51-4e78', email: 'sophia.chen@acme.io', full_name: 'Sophia Chen', role: 'admin', is_active: true, created_at: '2025-01-18 10:14:22+00' },
            { id: 'b3f572a1-6381-42e5', email: 'alex.morgan@venture.co', full_name: 'Alex Morgan', role: 'member', is_active: true, created_at: '2025-01-20 12:45:00+00' },
            { id: 'c4217ef8-8219-4a92', email: 'marcus.vance@techcorp.com', full_name: 'Marcus Vance', role: 'developer', is_active: true, created_at: '2025-01-22 18:22:15+00' },
            { id: 'd982103a-0e92-4912', email: 'elena.rostova@cloudscale.net', full_name: 'Elena Rostova', role: 'manager', is_active: true, created_at: '2025-01-25 08:30:19+00' },
          ],
          executionTimeMs: 16,
          rowCount: 4,
          status: 'success',
        })
      }
      setActiveBottomTab('results')
    }, 350)
  }, [currentSql])

  // Format Query
  const handleFormatQuery = () => {
    const formatted = currentSql
      .replace(/\s+/g, ' ')
      .replace(/ select /gi, '\nSELECT ')
      .replace(/ from /gi, '\nFROM ')
      .replace(/ where /gi, '\nWHERE ')
      .replace(/ join /gi, '\nJOIN ')
      .replace(/ group by /gi, '\nGROUP BY ')
      .replace(/ order by /gi, '\nORDER BY ')
      .replace(/ limit /gi, '\nLIMIT ')
      .trim()
    handleSqlChange(formatted)
  }

  // Save current SQL back to snippet
  const handleSave = useCallback(() => {
    setSnippets((prev) =>
      prev.map((s) => (s.id === activeSnippet.id ? { ...s, sql: currentSql } : s))
    )
    setDraftSqlMap((prev) => {
      const next = { ...prev }
      delete next[activeSnippet.id]
      return next
    })
  }, [activeSnippet.id, currentSql])

  // Duplicate current query
  const handleDuplicateQuery = () => {
    const newId = `query_${Date.now()}`
    const newSnippet: SqlSnippet = {
      id: newId,
      name: `${activeSnippet.name} (Duplicate)`,
      sql: currentSql,
      inserted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    setSnippets([newSnippet, ...snippets])
    setOpenTabIds([...openTabIds, newId])
    setActiveSnippetId(newId)
    setCurrentSql(newSnippet.sql)
  }

  // Delete current query
  const handleDeleteQuery = () => {
    if (snippets.length <= 1) return
    const nextSnippets = snippets.filter((s) => s.id !== activeSnippet.id)
    const nextTabs = openTabIds.filter((t) => t !== activeSnippet.id)
    setSnippets(nextSnippets)
    setOpenTabIds(nextTabs.length > 0 ? nextTabs : [nextSnippets[0].id])
    const nextActive = nextSnippets[0]
    setActiveSnippetId(nextActive.id)
    setCurrentSql(draftSqlMap[nextActive.id] ?? nextActive.sql)
  }

  // Rename current query
  const handleRenameQuery = () => {
    const newName = prompt('Enter query name:', activeSnippet.name)
    if (newName && newName.trim()) {
      setSnippets(
        snippets.map((s) =>
          s.id === activeSnippet.id ? { ...s, name: newName.trim() } : s
        )
      )
    }
  }

  // Folder CRUD handlers
  const handleCreateFolder = (name = 'New folder', visibility: 'private' | 'shared' = 'private') => {
    const newFolder: SqlFolder = {
      id: `folder_${Date.now()}`,
      name,
      visibility,
    }
    setFolders((prev) => [...prev, newFolder])
  }

  const handleRenameFolder = (folderId: string, newName: string) => {
    setFolders((prev) =>
      prev.map((f) => (f.id === folderId ? { ...f, name: newName } : f))
    )
  }

  const handleDeleteFolder = (folderId: string) => {
    setFolders((prev) => prev.filter((f) => f.id !== folderId))
    const remainingSnippets = snippets.filter((s) => s.folderId !== folderId)
    if (remainingSnippets.length === 0) {
      const fallback: SqlSnippet = {
        id: `query_${Date.now()}`,
        name: 'Untitled query',
        sql: 'SELECT * FROM public.users LIMIT 10;',
        inserted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        visibility: 'private',
      }
      setSnippets([fallback])
      setOpenTabIds([fallback.id])
      setActiveSnippetId(fallback.id)
      setCurrentSql(fallback.sql)
    } else {
      setSnippets(remainingSnippets)
      const nextTabs = openTabIds.filter(
        (id) => !snippets.some((s) => s.id === id && s.folderId === folderId)
      )
      const finalTabs = nextTabs.length > 0 ? nextTabs : [remainingSnippets[0].id]
      setOpenTabIds(finalTabs)
      if (!finalTabs.includes(activeSnippetId)) {
        setActiveSnippetId(finalTabs[0])
        setCurrentSql(draftSqlMap[finalTabs[0]] ?? remainingSnippets[0].sql)
      }
    }
  }

  const handleCreateQueryInFolder = (folderId: string) => {
    const newId = `query_${Date.now()}`
    const newSnippet: SqlSnippet = {
      id: newId,
      name: 'Untitled query',
      sql: `-- Type your SQL query here\nSELECT * FROM public.users LIMIT 10;`,
      inserted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      folderId,
      visibility: 'private',
    }
    setSnippets((prev) => [newSnippet, ...prev])
    setOpenTabIds((prev) => [...prev, newId])
    setActiveSnippetId(newId)
    setCurrentSql(newSnippet.sql)
  }

  // Snippet item handlers
  const handleToggleFavorite = (snippetId: string) => {
    setSnippets((prev) =>
      prev.map((s) => (s.id === snippetId ? { ...s, isFavorite: !s.isFavorite } : s))
    )
  }

  const handleToggleVisibility = (snippetId: string) => {
    setSnippets((prev) =>
      prev.map((s) =>
        s.id === snippetId
          ? { ...s, visibility: s.visibility === 'shared' ? 'private' : 'shared' }
          : s
      )
    )
  }

  const handleRenameSnippet = (snippetId: string, newName: string) => {
    setSnippets((prev) =>
      prev.map((s) => (s.id === snippetId ? { ...s, name: newName } : s))
    )
  }

  const handleDuplicateSnippet = (snippet: SqlSnippet) => {
    const newId = `query_${Date.now()}`
    const duplicate: SqlSnippet = {
      ...snippet,
      id: newId,
      name: `${snippet.name} (Duplicate)`,
      inserted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    setSnippets((prev) => [duplicate, ...prev])
    setOpenTabIds((prev) => [...prev, newId])
    setActiveSnippetId(newId)
    setCurrentSql(duplicate.sql)
  }

  const handleDeleteSnippet = (snippetId: string) => {
    if (snippets.length <= 1) return
    const nextSnippets = snippets.filter((s) => s.id !== snippetId)
    const nextTabs = openTabIds.filter((t) => t !== snippetId)
    const finalTabs = nextTabs.length > 0 ? nextTabs : [nextSnippets[0].id]
    setSnippets(nextSnippets)
    setOpenTabIds(finalTabs)
    if (activeSnippetId === snippetId) {
      setActiveSnippetId(finalTabs[0])
      setCurrentSql(draftSqlMap[finalTabs[0]] ?? nextSnippets[0].sql)
    }
  }

  // Global Keyboard shortcuts: Ctrl+S to save, Ctrl+Enter to run
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        handleSave()
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault()
        handleRunQuery()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleSave, handleRunQuery])

  // Download Results CSV
  const handleDownloadCsv = () => {
    if (queryResult) {
      downloadResultsAsCsv(queryResult)
    }
  }

  return (
    <div className="flex h-full w-full overflow-hidden bg-studio">
      {/* 1. Left Secondary Sidebar: Queries Menu */}
      {isSidebarOpen && (
        <SqlSidebar
          snippets={snippets}
          folders={folders}
          activeSnippetId={activeSnippetId}
          search={search}
          onSearchChange={setSearch}
          onSelectSnippet={handleSelectSnippet}
          onCreateNewQuery={handleCreateNewQuery}
          onCreateFolder={handleCreateFolder}
          onRenameFolder={handleRenameFolder}
          onDeleteFolder={handleDeleteFolder}
          onCreateQueryInFolder={handleCreateQueryInFolder}
          onToggleFavorite={handleToggleFavorite}
          onToggleVisibility={handleToggleVisibility}
          onRenameSnippet={handleRenameSnippet}
          onDuplicateSnippet={handleDuplicateSnippet}
          onDeleteSnippet={handleDeleteSnippet}
        />
      )}

      {/* 2. Main Editor & Results Container */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
        {/* Top Tab Bar for Opened Queries */}
        <SqlTabBar
          snippets={snippets}
          openTabIds={openTabIds}
          activeSnippetId={activeSnippetId}
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
          onSelectTab={handleSelectTab}
          onCloseTab={handleCloseTab}
          onCreateNewQuery={handleCreateNewQuery}
          unsavedSnippetIds={unsavedSnippetIds}
        />

        {/* Action Toolbar above Code Editor */}
        <SqlActionToolbar
          isExecuting={isExecuting}
          hasUnsavedEdits={unsavedSnippetIds.has(activeSnippetId)}
          onRunQuery={handleRunQuery}
          onFormatQuery={handleFormatQuery}
          onSave={handleSave}
          onDuplicateQuery={handleDuplicateQuery}
          onRenameQuery={handleRenameQuery}
          onDeleteQuery={snippets.length > 1 ? handleDeleteQuery : undefined}
        />

        {/* Split Pane: Monaco Editor on Top, Results Table on Bottom */}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {/* Top Monaco Editor Pane */}
          <SqlCodeEditor
            value={currentSql}
            onChange={handleSqlChange}
          />

          {/* Bottom Utility Results Pane */}
          <SqlResultsPane
            queryResult={queryResult}
            activeBottomTab={activeBottomTab}
            onActiveBottomTabChange={setActiveBottomTab}
            onRunQuery={handleRunQuery}
            onDownloadCsv={handleDownloadCsv}
          />
        </div>
      </div>
    </div>
  )
}

