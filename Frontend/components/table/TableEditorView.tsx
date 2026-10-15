'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import {
  MOCK_SCHEMAS,
  TableDefinition,
  ColumnDefinition,
} from '@/lib/mock-data'

// Sub-components
import { TableExplorer } from '@/components/table/explorer/TableExplorer'
import { TableToolbar } from '@/components/table/editor/TableToolbar'
import { TableDataGrid } from '@/components/table/editor/TableDataGrid'
import { TableDefinitionView } from '@/components/table/editor/TableDefinitionView'
import { InsertRowModal } from '@/components/table/insert/InsertRowModal'
import { InsertColumnModal } from '@/components/table/insert/InsertColumnModal'
import { InsertTableModal } from '@/components/table/insert/InsertTableModal'
import { DeleteTableModal } from '@/components/table/delete/DeleteTableModal'
import { EditTableModal, EditTableValues } from '@/components/table/edit/EditTableModal'
import { TablePoliciesModal } from '@/components/table/edit/TablePoliciesModal'
import { TableAction } from '@/components/table/explorer/TableExplorer'
import { ColumnAction } from '@/components/table/editor/TableDataGrid'
import { TableTabBar, NEW_TAB_ID } from '@/components/table/tabs/TableTabBar'
import { TableNewTabView, RecentTableItem } from '@/components/table/tabs/TableNewTabView'
import { Alert } from '@/components/ui/alert'
import { CreatePolicySheet } from '@/components/table/CreatePolicySheet'
import { DeleteRowsModal } from '@/components/table/delete/DeleteRowsModal'
import { useRouter } from 'next/navigation'

/** Looks up a table by id across all schemas */
const findTableById = (id: string) => {
  for (const schema of MOCK_SCHEMAS) {
    const tbl = schema.tables.find((t) => t.id === id)
    if (tbl) return tbl
  }
  return undefined
}

export function TableEditorView() {
  const router = useRouter()
  const [selectedSchema, setSelectedSchema] = useState('public')
  const currentSchemaData = MOCK_SCHEMAS.find((s) => s.name === selectedSchema) || MOCK_SCHEMAS[0]

  const [selectedTable, setSelectedTable] = useState<TableDefinition>(
    currentSchemaData.tables[0] || MOCK_SCHEMAS[0].tables[0]
  )
  const [tableSearch, setTableSearch] = useState('')
  const [activeViewMode, setActiveViewMode] = useState<'data' | 'definition'>('data')

  // Tabs state
  const [openTabIds, setOpenTabIds] = useState<string[]>(() =>
    selectedTable ? [selectedTable.id] : [NEW_TAB_ID]
  )
  const [activeTabId, setActiveTabId] = useState<string>(() =>
    selectedTable ? selectedTable.id : NEW_TAB_ID
  )
  const [recentItems, setRecentItems] = useState<RecentTableItem[]>(() =>
    selectedTable ? [{ tableId: selectedTable.id, openedAt: Date.now() }] : []
  )
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const isNewTabActive = activeTabId === NEW_TAB_ID
  const isNewTabActiveRef = useRef(isNewTabActive)
  isNewTabActiveRef.current = isNewTabActive

  // Filter & Sort state
  const [filterSearch, setFilterSearch] = useState('')
  const [selectedRole, setSelectedRole] = useState('postgres')
  const [filterColumn, setFilterColumn] = useState<string>('')
  const [filterValue, setFilterValue] = useState<string>('')
  const [activeFilter, setActiveFilter] = useState<{ column: string; value: string } | null>(null)
  const [sortColumn, setSortColumn] = useState<string>('')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

  // Modals state
  const [isInsertTableModalOpen, setIsInsertTableModalOpen] = useState(false)
  const [tablePendingDelete, setTablePendingDelete] = useState<TableDefinition | null>(null)
  const [tableToEdit, setTableToEdit] = useState<TableDefinition | null>(null)
  const [tableForPolicies, setTableForPolicies] = useState<TableDefinition | null>(null)
  const [editingColumnId, setEditingColumnId] = useState<string | null>(null)
  // Frozen column ids, keyed by table id
  const [frozenByTable, setFrozenByTable] = useState<Record<string, string[]>>({})
  const [isInsertModalOpen, setIsInsertModalOpen] = useState(false)
  const [newRowData, setNewRowData] = useState<Record<string, any>>({})
  const [isInsertColumnModalOpen, setIsInsertColumnModalOpen] = useState(false)
  const [isCreatePolicyOpen, setIsCreatePolicyOpen] = useState(false)
  const [isDeleteRowsModalOpen, setIsDeleteRowsModalOpen] = useState(false)
  const [newColumnData, setNewColumnData] = useState<{
    name: string
    type: string
    defaultValue: string
    description?: string
    isArray?: boolean
    isPrimaryKey?: boolean
    isNullable?: boolean
  }>({ name: '', type: 'text', defaultValue: '', isNullable: true })

  // Toast state
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const showToast = useCallback((msg: string) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current)
    setToastMessage(msg)
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage(null)
    }, 2500)
  }, [])

  // Selected row state
  const [selectedRowIds, setSelectedRowIds] = useState<Set<string>>(new Set())

  // Side Drawer for Column/Table Info
  const [sideDrawerOpen, setSideDrawerOpen] = useState(false)
  const [inspectedColumn, setInspectedColumn] = useState<ColumnDefinition | null>(null)

  // Keyboard shortcut for Insert row (I then R) and Insert column (I then C)
  useEffect(() => {
    let pendingI = false
    let timeout: any
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) return
      if (isNewTabActiveRef.current) return
      if (e.key.toLowerCase() === 'i') {
        pendingI = true
        clearTimeout(timeout)
        timeout = setTimeout(() => {
          pendingI = false
        }, 1200)
        return
      }
      if (pendingI) {
        if (e.key.toLowerCase() === 'r') {
          e.preventDefault()
          setIsInsertModalOpen(true)
          pendingI = false
        } else if (e.key.toLowerCase() === 'c') {
          e.preventDefault()
          setIsInsertColumnModalOpen(true)
          pendingI = false
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      clearTimeout(timeout)
    }
  }, [])

  const resetTableView = () => {
    setActiveFilter(null)
    setSortColumn('')
    setFilterSearch('')
    setSelectedRowIds(new Set())
  }

  /** Updates the selected table and persists the change back into the schema list */
  const updateSelectedTable = (updated: TableDefinition) => {
    setSelectedTable(updated)
    for (const schema of MOCK_SCHEMAS) {
      const i = schema.tables.findIndex((t) => t.id === updated.id)
      if (i !== -1) {
        schema.tables[i] = updated
        break
      }
    }
  }

  /** Opens a table in its own tab (or focuses its existing tab) */
  const openTable = (table: TableDefinition) => {
    setSelectedTable(table)
    resetTableView()
    setOpenTabIds((prev) => {
      if (prev.includes(table.id)) return prev
      // Opening from the "New" tab replaces it
      if (activeTabId === NEW_TAB_ID) return prev.map((id) => (id === NEW_TAB_ID ? table.id : id))
      return [...prev, table.id]
    })
    setActiveTabId(table.id)
    setRecentItems((prev) =>
      [{ tableId: table.id, openedAt: Date.now() }, ...prev.filter((r) => r.tableId !== table.id)].slice(0, 10)
    )
  }

  const activateTab = (id: string) => {
    setActiveTabId(id)
    if (id === NEW_TAB_ID) return
    const tbl = findTableById(id)
    if (tbl) {
      setSelectedTable(tbl)
      resetTableView()
    }
  }

  const closeTab = (id: string) => {
    const idx = openTabIds.indexOf(id)
    if (idx === -1) return
    let next = openTabIds.filter((t) => t !== id)
    if (next.length === 0) next = [NEW_TAB_ID]
    setOpenTabIds(next)
    if (activeTabId === id) {
      activateTab(next[Math.min(idx, next.length - 1)])
    }
  }

  const openNewTab = () => {
    setOpenTabIds((prev) => (prev.includes(NEW_TAB_ID) ? prev : [...prev, NEW_TAB_ID]))
    setActiveTabId(NEW_TAB_ID)
  }

  // Switch schema handler
  const handleSelectSchema = (schema: string) => {
    setSelectedSchema(schema)
    const schemaObj = MOCK_SCHEMAS.find((s) => s.name === schema)
    if (schemaObj && schemaObj.tables.length > 0) {
      openTable(schemaObj.tables[0])
    } else {
      resetTableView()
    }
  }

  // Filtered tables in sidebar
  const filteredTables = currentSchemaData.tables.filter((tbl) =>
    tbl.name.toLowerCase().includes(tableSearch.toLowerCase())
  )

  // Rows processing: filtering & sorting
  let displayedRows = [...selectedTable.rows]
  if (filterSearch.trim()) {
    const q = filterSearch.toLowerCase().trim()
    displayedRows = displayedRows.filter((r) =>
      selectedTable.columns.some((col) =>
        String(r[col.name] ?? '').toLowerCase().includes(q)
      )
    )
  }
  if (activeFilter && activeFilter.column && activeFilter.value) {
    displayedRows = displayedRows.filter((r) => {
      const val = String(r[activeFilter.column] || '').toLowerCase()
      return val.includes(activeFilter.value.toLowerCase())
    })
  }
  if (sortColumn) {
    displayedRows.sort((a, b) => {
      const valA = a[sortColumn]
      const valB = b[sortColumn]
      if (valA === valB) return 0
      if (valA === null || valA === undefined) return 1
      if (valB === null || valB === undefined) return -1
      const comparison = valA < valB ? -1 : 1
      return sortDirection === 'asc' ? comparison : -comparison
    })
  }

  // Row selection toggle
  const toggleSelectAll = () => {
    if (selectedRowIds.size === displayedRows.length) {
      setSelectedRowIds(new Set())
    } else {
      setSelectedRowIds(new Set(displayedRows.map((_, i) => String(i))))
    }
  }

  const toggleSelectRow = (idx: string) => {
    const next = new Set(selectedRowIds)
    if (next.has(idx)) {
      next.delete(idx)
    } else {
      next.add(idx)
    }
    setSelectedRowIds(next)
  }

  const getSelectedRowsData = () => {
    const indices = Array.from(selectedRowIds).map(Number)
    return indices.map((i) => displayedRows[i]).filter(Boolean)
  }

  const handleCopyCsv = () => {
    const rows = getSelectedRowsData()
    const headers = selectedTable.columns.map((c) => c.name).join(',')
    const csvContent = rows
      .map((r) => selectedTable.columns.map((c) => `"${r[c.name] ?? ''}"`).join(','))
      .join('\n')
    navigator.clipboard?.writeText(`${headers}\n${csvContent}`)
    showToast('Copied rows as CSV to clipboard!')
  }

  const handleCopyJson = () => {
    const rows = getSelectedRowsData()
    navigator.clipboard?.writeText(JSON.stringify(rows, null, 2))
    showToast('Copied rows as JSON to clipboard!')
  }

  const handleCopySql = () => {
    const rows = getSelectedRowsData()
    const cols = selectedTable.columns.map((c) => `"${c.name}"`).join(', ')
    const sql = rows
      .map((r) => {
        const vals = selectedTable.columns
          .map((c) => {
            const v = r[c.name]
            if (v === null || v === undefined) return 'NULL'
            if (typeof v === 'number' || typeof v === 'boolean') return String(v)
            return `'${String(v).replace(/'/g, "''")}'`
          })
          .join(', ')
        return `INSERT INTO "${selectedTable.schema}"."${selectedTable.name}" (${cols}) VALUES (${vals});`
      })
      .join('\n')
    navigator.clipboard?.writeText(sql)
    showToast('Copied SQL insert statements to clipboard!')
  }

  const handleExportSelectedCsv = () => {
    const rows = getSelectedRowsData()
    const headers = selectedTable.columns.map((c) => c.name).join(',')
    const csvContent = rows
      .map((r) => selectedTable.columns.map((c) => `"${r[c.name] ?? ''}"`).join(','))
      .join('\n')
    const blob = new Blob([`${headers}\n${csvContent}`], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${selectedTable.name}_selected.csv`
    a.click()
    URL.revokeObjectURL(url)
    showToast('Exported CSV successfully.')
  }

  const handleExportSelectedJson = () => {
    const rows = getSelectedRowsData()
    const blob = new Blob([JSON.stringify(rows, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${selectedTable.name}_selected.json`
    a.click()
    URL.revokeObjectURL(url)
    showToast('Exported JSON successfully.')
  }

  // Delete Selected Rows (Confirm handler)
  const handleConfirmDeleteRows = () => {
    const count = selectedRowIds.size
    if (count === 0) return
    const selectedIndices = new Set(Array.from(selectedRowIds).map(Number))
    const updatedRows = selectedTable.rows.filter((_, idx) => !selectedIndices.has(idx))
    updateSelectedTable({
      ...selectedTable,
      rows: updatedRows,
      estimatedRowCount: Math.max(0, selectedTable.estimatedRowCount - count),
    })
    setSelectedRowIds(new Set())
    showToast(`Deleted ${count} ${count === 1 ? 'row' : 'rows'} successfully.`)
  }

  // Insert / Edit Column Submit
  const handleInsertColumn = (keepOpen = false) => {
    if (!newColumnData.name.trim()) return
    const colName = newColumnData.name.trim().toLowerCase()

    // Edit an existing column
    if (editingColumnId) {
      const oldCol = selectedTable.columns.find((c) => c.id === editingColumnId)
      if (!oldCol) return
      if (colName !== oldCol.name && selectedTable.columns.some((c) => c.name === colName)) {
        showToast(`A column named "${colName}" already exists.`)
        return
      }
      const updatedCol: ColumnDefinition = {
        ...oldCol,
        name: colName,
        format: newColumnData.type,
        dataType: newColumnData.type,
        isPrimaryKey: !!newColumnData.isPrimaryKey,
        isNullable: newColumnData.isNullable !== false,
        defaultValue: newColumnData.defaultValue || null,
      }
      const renamed = colName !== oldCol.name
      updateSelectedTable({
        ...selectedTable,
        columns: selectedTable.columns.map((c) => (c.id === oldCol.id ? updatedCol : c)),
        rows: renamed
          ? selectedTable.rows.map((r) => {
              const { [oldCol.name]: val, ...rest } = r
              return { ...rest, [colName]: val }
            })
          : selectedTable.rows,
      })
      if (renamed && sortColumn === oldCol.name) setSortColumn(colName)
      setIsInsertColumnModalOpen(false)
      setEditingColumnId(null)
      setNewColumnData({ name: '', type: 'text', defaultValue: '', isNullable: true })
      showToast(`Column "${colName}" updated successfully.`)
      return
    }

    const newCol: ColumnDefinition = {
      id: `col-${Date.now()}`,
      name: colName,
      format: newColumnData.type,
      dataType: newColumnData.type,
      isPrimaryKey: !!newColumnData.isPrimaryKey,
      isNullable: newColumnData.isNullable !== false,
      defaultValue: newColumnData.defaultValue || null,
    }
    const updatedCols = [...selectedTable.columns, newCol]
    const updatedRows = selectedTable.rows.map((r) => ({
      ...r,
      [newCol.name]: newCol.defaultValue || null,
    }))
    updateSelectedTable({
      ...selectedTable,
      columns: updatedCols,
      rows: updatedRows,
    })
    if (!keepOpen) {
      setIsInsertColumnModalOpen(false)
    }
    setNewColumnData({ name: '', type: 'text', defaultValue: '', isNullable: true })
    showToast(`Column "${colName}" added successfully.`)
  }

  const handleColumnModalOpenChange = (open: boolean) => {
    setIsInsertColumnModalOpen(open)
    if (!open && editingColumnId) {
      setEditingColumnId(null)
      setNewColumnData({ name: '', type: 'text', defaultValue: '', isNullable: true })
    }
  }

  // Column header menu actions
  const handleColumnAction = (col: ColumnDefinition, action: ColumnAction) => {
    switch (action) {
      case 'sort-asc':
      case 'sort-desc':
        setSortColumn(col.name)
        setSortDirection(action === 'sort-asc' ? 'asc' : 'desc')
        break
      case 'copy-name':
        navigator.clipboard?.writeText(col.name)
        showToast(`Copied "${col.name}" to clipboard.`)
        break
      case 'edit':
        setEditingColumnId(col.id)
        setNewColumnData({
          name: col.name,
          type: col.format,
          defaultValue: col.defaultValue ?? '',
          isPrimaryKey: col.isPrimaryKey,
          isNullable: col.isNullable,
        })
        setIsInsertColumnModalOpen(true)
        break
      case 'toggle-freeze': {
        const current = frozenByTable[selectedTable.id] ?? []
        const isFrozen = current.includes(col.id)
        setFrozenByTable({
          ...frozenByTable,
          [selectedTable.id]: isFrozen ? current.filter((id) => id !== col.id) : [...current, col.id],
        })
        showToast(`Column "${col.name}" ${isFrozen ? 'unfrozen' : 'frozen'}.`)
        break
      }
      case 'delete': {
        updateSelectedTable({
          ...selectedTable,
          columns: selectedTable.columns.filter((c) => c.id !== col.id),
          rows: selectedTable.rows.map((r) => {
            const { [col.name]: _removed, ...rest } = r
            return rest
          }),
        })
        if (sortColumn === col.name) setSortColumn('')
        setFrozenByTable((prev) => ({
          ...prev,
          [selectedTable.id]: (prev[selectedTable.id] ?? []).filter((id) => id !== col.id),
        }))
        showToast(`Column "${col.name}" deleted successfully.`)
        break
      }
    }
  }

  // Insert Row Submit
  const handleInsertRow = (keepOpen = false) => {
    const newRow = { ...newRowData }
    selectedTable.columns.forEach((c) => {
      if (c.isPrimaryKey && !newRow[c.name]) {
        newRow[c.name] = `new-${Math.random().toString(36).substring(2, 9)}`
      } else if (newRow[c.name] === undefined && c.defaultValue) {
        newRow[c.name] = c.defaultValue
      }
    })
    selectedTable.rows.unshift(newRow)
    selectedTable.estimatedRowCount += 1
    if (!keepOpen) {
      setIsInsertModalOpen(false)
    }
    setNewRowData({})
    showToast(`Row inserted into "${selectedTable.name}" successfully.`)
  }

  // Insert Table Submit
  const handleInsertTable = (newTable: TableDefinition) => {
    currentSchemaData.tables.push(newTable)
    openTable(newTable)
    showToast(`Table "${newTable.name}" created successfully.`)
  }

  // Delete Table: open confirmation modal first
  const handleDeleteTable = (tableToDelete: TableDefinition) => {
    setTablePendingDelete(tableToDelete)
  }

  // Delete Table Confirm: show loader, delete, then toast
  const handleConfirmDeleteTable = async (tableToDelete: TableDefinition, cascade: boolean) => {
    // Simulate network latency so the loader is visible
    await new Promise((resolve) => setTimeout(resolve, 1000))
    const idx = currentSchemaData.tables.findIndex((t) => t.id === tableToDelete.id)
    if (idx !== -1) {
      currentSchemaData.tables.splice(idx, 1)
      // Close its tab (activates a neighbor or the New tab) and drop it from recents
      closeTab(tableToDelete.id)
      setRecentItems((prev) => prev.filter((r) => r.tableId !== tableToDelete.id))
      showToast(
        `Table "${tableToDelete.name}" deleted successfully${cascade ? ' (with cascade)' : ''}.`
      )
    }
  }

  const handleSelectTable = (table: TableDefinition) => {
    openTable(table)
  }

  /** Writes a table back into its schema; syncs the open table if it is the same one */
  const persistTable = (updated: TableDefinition) => {
    for (const schema of MOCK_SCHEMAS) {
      const i = schema.tables.findIndex((t) => t.id === updated.id)
      if (i !== -1) {
        schema.tables[i] = updated
        break
      }
    }
    if (selectedTable?.id === updated.id) setSelectedTable(updated)
  }

  const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  const sqlValue = (v: any) => {
    if (v === null || v === undefined) return 'NULL'
    if (typeof v === 'number' || typeof v === 'boolean') return String(v)
    return `'${String(v).replace(/'/g, "''")}'`
  }

  const buildCreateTableSql = (t: TableDefinition) => {
    const pkCols = t.columns.filter((c) => c.isPrimaryKey).map((c) => `"${c.name}"`)
    const lines = t.columns.map((c) => {
      let line = `  "${c.name}" ${c.dataType || c.format}`
      if (!c.isNullable) line += ' NOT NULL'
      if (c.isUnique) line += ' UNIQUE'
      if (c.defaultValue) line += ` DEFAULT ${c.defaultValue}`
      if (c.foreignKey) {
        line += ` REFERENCES "${c.foreignKey.targetSchema ?? t.schema}"."${c.foreignKey.targetTable}"("${c.foreignKey.targetColumn}")`
      }
      return line
    })
    if (pkCols.length) lines.push(`  PRIMARY KEY (${pkCols.join(', ')})`)
    let sql = `CREATE TABLE "${t.schema}"."${t.name}" (\n${lines.join(',\n')}\n);`
    if (t.comment) sql += `\n\nCOMMENT ON TABLE "${t.schema}"."${t.name}" IS ${sqlValue(t.comment)};`
    if (t.rlsEnabled) sql += `\n\nALTER TABLE "${t.schema}"."${t.name}" ENABLE ROW LEVEL SECURITY;`
    return sql
  }

  // Table row "⋮" menu actions
  const handleTableAction = (table: TableDefinition, action: TableAction) => {
    switch (action) {
      case 'copy-name':
        navigator.clipboard?.writeText(table.name)
        showToast(`Copied "${table.name}" to clipboard.`)
        break
      case 'copy-schema':
        navigator.clipboard?.writeText(buildCreateTableSql(table))
        showToast(`Copied schema of "${table.name}" to clipboard.`)
        break
      case 'edit':
        setTableToEdit(table)
        break
      case 'duplicate': {
        const schemaObj = MOCK_SCHEMAS.find((s) => s.name === table.schema) ?? currentSchemaData
        const names = new Set(schemaObj.tables.map((t) => t.name))
        let name = `${table.name}_copy`
        for (let n = 2; names.has(name); n++) name = `${table.name}_copy${n}`
        const copy: TableDefinition = {
          ...table,
          id: `tbl-${Date.now()}`,
          name,
          columns: table.columns.map((c) => ({ ...c })),
          rows: table.rows.map((r) => ({ ...r })),
        }
        schemaObj.tables.push(copy)
        openTable(copy)
        showToast(`Table "${table.name}" duplicated as "${name}".`)
        break
      }
      case 'view-policies':
        setTableForPolicies(table)
        break
      case 'export-csv': {
        const headers = table.columns.map((c) => c.name).join(',')
        const body = table.rows
          .map((r) =>
            table.columns.map((c) => `"${String(r[c.name] ?? '').replace(/"/g, '""')}"`).join(',')
          )
          .join('\n')
        downloadFile(`${headers}\n${body}`, `${table.name}.csv`, 'text/csv')
        showToast(`Exported "${table.name}" as CSV.`)
        break
      }
      case 'export-json':
        downloadFile(JSON.stringify(table.rows, null, 2), `${table.name}.json`, 'application/json')
        showToast(`Exported "${table.name}" as JSON.`)
        break
      case 'export-sql': {
        const cols = table.columns.map((c) => `"${c.name}"`).join(', ')
        const inserts = table.rows
          .map(
            (r) =>
              `INSERT INTO "${table.schema}"."${table.name}" (${cols}) VALUES (${table.columns
                .map((c) => sqlValue(r[c.name]))
                .join(', ')});`
          )
          .join('\n')
        downloadFile(`${buildCreateTableSql(table)}\n\n${inserts}\n`, `${table.name}.sql`, 'application/sql')
        showToast(`Exported "${table.name}" as SQL.`)
        break
      }
      case 'delete':
        handleDeleteTable(table)
        break
    }
  }

  const handleSaveTableEdit = async (table: TableDefinition, values: EditTableValues) => {
    // Simulate network latency so the loader is visible
    await new Promise((resolve) => setTimeout(resolve, 600))
    const updated: TableDefinition = {
      ...table,
      name: values.name,
      comment: values.comment || undefined,
      rlsEnabled: values.rlsEnabled,
      realtimeEnabled: values.realtimeEnabled,
    }
    persistTable(updated)
    showToast(`Table "${updated.name}" updated successfully.`)
  }

  const handleTogglePoliciesRls = (table: TableDefinition) => {
    const updated = { ...table, rlsEnabled: !table.rlsEnabled }
    persistTable(updated)
    setTableForPolicies(updated)
    showToast(`Row Level Security (RLS) ${updated.rlsEnabled ? 'enabled' : 'disabled'} on "${table.name}".`)
  }

  const handleRefresh = () => {
    setSelectedRowIds(new Set())
    setFilterSearch('')
    setActiveFilter(null)
    setSortColumn('')
    showToast('Refreshed table data.')
  }

  const handleToggleRls = () => {
    const nextState = !selectedTable.rlsEnabled
    updateSelectedTable({
      ...selectedTable,
      rlsEnabled: nextState,
    })
    showToast(`Row Level Security (RLS) ${nextState ? 'enabled' : 'disabled'}.`)
  }

  return (
    <div className="flex h-full w-full overflow-hidden bg-studio relative">
      {/* Toast Notification positioned at bottom-right */}
      {toastMessage && (
        <Alert
          position="bottom-right"
          variant="success"
          onClose={() => setToastMessage(null)}
        >
          {toastMessage}
        </Alert>
      )}

      {/* 1. Left Secondary Sidebar: Tables Menu */}
      {isSidebarOpen && (
        <TableExplorer
          selectedSchema={selectedSchema}
          schemas={MOCK_SCHEMAS.map((s) => s.name)}
          onSelectSchema={handleSelectSchema}
          tableSearch={tableSearch}
          onTableSearchChange={setTableSearch}
          filteredTables={filteredTables}
          selectedTable={isNewTabActive ? null : selectedTable}
          onSelectTable={handleSelectTable}
          onNewTable={() => setIsInsertTableModalOpen(true)}
          onTableAction={handleTableAction}
        />
      )}

      {/* 2. Main Content Area */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
        {/* Tabs: one per open table */}
        <TableTabBar
          openTabIds={openTabIds}
          activeTabId={activeTabId}
          getTable={findTableById}
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={() => setIsSidebarOpen((o) => !o)}
          onSelectTab={activateTab}
          onCloseTab={closeTab}
          onNewTab={openNewTab}
          onTableAction={handleTableAction}
        />

        {isNewTabActive || !selectedTable ? (
          <TableNewTabView
            recentItems={recentItems}
            getTable={findTableById}
            onCreateTable={() => setIsInsertTableModalOpen(true)}
            onOpenTable={openTable}
          />
        ) : (
          <>
            {/* Table Grid Toolbar */}
            <TableToolbar
              selectedTable={selectedTable}
              selectedRowIds={selectedRowIds}
              filterSearch={filterSearch}
              onFilterSearchChange={setFilterSearch}
              sortColumn={sortColumn}
              onSortColumnChange={setSortColumn}
              sortDirection={sortDirection}
              onSortDirectionChange={setSortDirection}
              selectedRole={selectedRole}
              onSelectedRoleChange={setSelectedRole}
              onCopyCsv={handleCopyCsv}
              onCopyJson={handleCopyJson}
              onCopySql={handleCopySql}
              onExportCsv={handleExportSelectedCsv}
              onExportJson={handleExportSelectedJson}
              onDeleteSelected={() => setIsDeleteRowsModalOpen(true)}
              onToggleRls={handleToggleRls}
              onAddRlsPolicy={() => router.push('/policies')}
              onRefresh={handleRefresh}
              onInsertRow={() => setIsInsertModalOpen(true)}
              onInsertColumn={() => setIsInsertColumnModalOpen(true)}
            />

            {/* View Mode: Data Grid or Definition */}
            {activeViewMode === 'data' ? (
              <TableDataGrid
                selectedTable={selectedTable}
                displayedRows={displayedRows}
                selectedRowIds={selectedRowIds}
                onToggleSelectAll={toggleSelectAll}
                onToggleSelectRow={toggleSelectRow}
                onInsertColumn={() => setIsInsertColumnModalOpen(true)}
                sortColumn={sortColumn}
                sortDirection={sortDirection}
                frozenColumnIds={new Set(frozenByTable[selectedTable.id] ?? [])}
                onColumnAction={handleColumnAction}
                onUpdateCell={(rowIdx, colName, value) => {
                  const newRows = [...selectedTable.rows]
                  newRows[rowIdx] = { ...newRows[rowIdx], [colName]: value }
                  updateSelectedTable({ ...selectedTable, rows: newRows })
                  showToast("Table updated")
                }}
              />
            ) : (
              <TableDefinitionView selectedTable={selectedTable} />
            )}
          </>
        )}
      </div>

      {/* Insert Table Modal */}
      <InsertTableModal
        open={isInsertTableModalOpen}
        onOpenChange={setIsInsertTableModalOpen}
        schemaName={selectedSchema}
        onInsertTable={handleInsertTable}
      />

      {/* Delete Table Confirmation Modal */}
      <DeleteTableModal
        open={!!tablePendingDelete}
        onOpenChange={(open) => !open && setTablePendingDelete(null)}
        table={tablePendingDelete}
        onConfirm={handleConfirmDeleteTable}
      />

      {/* Edit Table Modal */}
      <EditTableModal
        open={!!tableToEdit}
        onOpenChange={(open) => !open && setTableToEdit(null)}
        table={tableToEdit}
        existingNames={
          tableToEdit
            ? (MOCK_SCHEMAS.find((s) => s.name === tableToEdit.schema)?.tables ?? [])
                .filter((t) => t.id !== tableToEdit.id)
                .map((t) => t.name)
            : []
        }
        onSave={handleSaveTableEdit}
      />

      {/* Table Policies Modal */}
      <TablePoliciesModal
        open={!!tableForPolicies}
        onOpenChange={(open) => !open && setTableForPolicies(null)}
        table={tableForPolicies}
        onToggleRls={handleTogglePoliciesRls}
      />

      {/* Create Policy Sheet */}
      <CreatePolicySheet 
        open={isCreatePolicyOpen}
        onOpenChange={setIsCreatePolicyOpen}
        tableName={selectedTable ? `${selectedTable.schema}.${selectedTable.name}` : undefined}
      />

      {/* Insert Row Modal */}
      <InsertRowModal
        open={isInsertModalOpen}
        onOpenChange={setIsInsertModalOpen}
        selectedTable={selectedTable}
        newRowData={newRowData}
        onNewRowDataChange={setNewRowData}
        onInsert={handleInsertRow}
      />

      {/* Delete Rows Confirmation Modal */}
      <DeleteRowsModal
        open={isDeleteRowsModalOpen}
        onOpenChange={setIsDeleteRowsModalOpen}
        rowCount={selectedRowIds.size}
        onConfirm={handleConfirmDeleteRows}
      />

      {/* Insert Column Modal */}
      <InsertColumnModal
        open={isInsertColumnModalOpen}
        onOpenChange={handleColumnModalOpenChange}
        selectedTable={selectedTable}
        newColumnData={newColumnData}
        onNewColumnDataChange={setNewColumnData}
        onInsert={handleInsertColumn}
        mode={editingColumnId ? 'edit' : 'create'}
      />
    </div>
  )
}
