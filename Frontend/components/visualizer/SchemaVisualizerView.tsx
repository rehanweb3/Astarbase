'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Background,
  BackgroundVariant,
  Controls,
  Handle,
  MiniMap,
  Node,
  NodeProps,
  Position,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  useReactFlow,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
// @ts-ignore
import dagre from 'dagre'
import {
  Check,
  ChevronDown,
  Copy,
  Diamond,
  Download,
  Fingerprint,
  Hash,
  Key,
  Link as LinkIcon,
  MoreVertical,
  Search,
  Table2 as TableIcon,
} from 'lucide-react'
import { SchemaSelector } from '@/components/ui/schema-selector'
import { Alert } from '@/components/ui/alert'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MOCK_SCHEMAS, TableDefinition } from '@/lib/mock-data'
import { useTheme } from '@/components/providers/ThemeProvider'
import { cn } from '@/lib/utils'

// Custom Table Node for ReactFlow
function TableNode({
  data,
}: NodeProps<Node<{ table: TableDefinition; isHighlighted?: boolean; isDimmed?: boolean }>>) {
  const table = data.table
  const isHighlighted = data.isHighlighted
  const isDimmed = data.isDimmed

  return (
    <div
      className={cn(
        'w-72 rounded-lg border bg-studio shadow-[0_1px_2px_rgba(0,0,0,0.04)] overflow-hidden text-sm select-none transition-all duration-200',
        isHighlighted && 'ring-2 ring-brand-500 border-brand-500 scale-[1.02] z-20',
        isDimmed && 'opacity-35 grayscale-[50%]',
        !isHighlighted && !isDimmed && 'border-default'
      )}
    >
      {/* Table Header */}
      <div className="px-3 py-2.5 border-b border-default flex items-center justify-between">
        <div className="flex items-center gap-2.5 truncate">
          <TableIcon className="h-4 w-4 text-foreground-light shrink-0" strokeWidth={1.5} />
          <span className="text-foreground truncate">{table.name}</span>
        </div>
        <MoreVertical className="h-4 w-4 text-foreground-light shrink-0" />
      </div>

      {/* Columns list */}
      <div className="divide-y divide-default">
        {table.columns.map((col) => {
          const isIdentity = col.isPrimaryKey && /^int/i.test(col.format || '')
          return (
            <div
              key={col.id}
              className="relative px-3 py-2 flex items-center justify-between gap-3 hover:bg-surface-100 transition-colors group"
            >
              {/* Left Handle for incoming connections */}
              <Handle
                type="target"
                position={Position.Left}
                id={`${table.name}-${col.name}-target`}
                className="!w-1.5 !h-1.5 !min-w-0 !min-h-0 !bg-foreground-muted !border-0 opacity-0 group-hover:opacity-100"
              />

              <div className="flex items-center gap-3 truncate">
                <div className="flex items-center gap-1.5 shrink-0 text-foreground-light">
                  {col.isPrimaryKey && (
                    <Key className="h-3.5 w-3.5 -rotate-45" strokeWidth={1.5} aria-label="Primary key" />
                  )}
                  {col.foreignKey && (
                    <LinkIcon className="h-3.5 w-3.5" strokeWidth={1.5} aria-label="Foreign key" />
                  )}
                  <Diamond
                    className={cn('h-3.5 w-3.5', !col.isNullable && 'fill-current')}
                    strokeWidth={1.5}
                    aria-label={col.isNullable ? 'Nullable' : 'Not null'}
                  />
                  {isIdentity && (
                    <Hash className="h-3.5 w-3.5" strokeWidth={1.5} aria-label="Identity" />
                  )}
                  {col.isUnique && !col.isPrimaryKey && (
                    <Fingerprint className="h-3.5 w-3.5" strokeWidth={1.5} aria-label="Unique" />
                  )}
                </div>
                <span className="truncate text-foreground">{col.name}</span>
              </div>

              <span className="shrink-0 text-xs font-mono text-foreground-lighter">
                {col.format}
              </span>

              {/* Right Handle for outgoing connections */}
              <Handle
                type="source"
                position={Position.Right}
                id={`${table.name}-${col.name}-source`}
                className="!w-1.5 !h-1.5 !min-w-0 !min-h-0 !bg-foreground-muted !border-0 opacity-0 group-hover:opacity-100"
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}

const nodeTypes = {
  tableNode: TableNode,
}

// Dagre Layout Algorithm for Auto Layout
function getLayoutedElements(nodes: any[], edges: any[], direction = 'LR') {
  try {
    const dagreGraph = new dagre.graphlib.Graph()
    dagreGraph.setDefaultEdgeLabel(() => ({}))
    dagreGraph.setGraph({ rankdir: direction, ranksep: 90, nodesep: 50 })

    nodes.forEach((node) => {
      const colCount = node.data?.table?.columns?.length || 4
      const height = 42 + colCount * 37
      dagreGraph.setNode(node.id, { width: 300, height })
    })

    edges.forEach((edge) => {
      dagreGraph.setEdge(edge.source, edge.target)
    })

    dagre.layout(dagreGraph)

    const layoutedNodes = nodes.map((node) => {
      const nodeWithPosition = dagreGraph.node(node.id)
      return {
        ...node,
        position: {
          x: nodeWithPosition.x - 150,
          y: nodeWithPosition.y - (42 + (node.data?.table?.columns?.length || 4) * 37) / 2,
        },
      }
    })

    return { nodes: layoutedNodes, edges }
  } catch (err) {
    console.error('Dagre layout failed, using grid fallback:', err)
    const layoutedNodes = nodes.map((node, index) => {
      const col = index % 3
      const row = Math.floor(index / 3)
      return {
        ...node,
        position: { x: 50 + col * 340, y: 50 + row * 280 },
      }
    })
    return { nodes: layoutedNodes, edges }
  }
}

// SQL DDL Generator
function generateSql(tables: TableDefinition[], schemaName: string): string {
  const lines: string[] = [
    `-- Schema: ${schemaName}`,
    `-- Generated on ${new Date().toLocaleDateString()}`,
    '',
  ]

  tables.forEach((table) => {
    lines.push(`CREATE TABLE "${schemaName}"."${table.name}" (`)
    const colDefs: string[] = []

    table.columns.forEach((col) => {
      let colDef = `  "${col.name}" ${col.dataType || col.format || 'text'}`
      if (col.isPrimaryKey) {
        colDef += ' PRIMARY KEY'
      }
      if (col.defaultValue) {
        colDef += ` DEFAULT ${col.defaultValue}`
      }
      if (col.foreignKey) {
        colDef += ` REFERENCES "${schemaName}"."${col.foreignKey.targetTable}" ("${col.foreignKey.targetColumn}")`
      }
      colDefs.push(colDef)
    })

    lines.push(colDefs.join(',\n'))
    lines.push(');\n')
  })

  return lines.join('\n')
}

// Markdown Documentation Generator
function generateMarkdown(tables: TableDefinition[], schemaName: string): string {
  const lines: string[] = [
    `# Schema: ${schemaName}\n`,
  ]

  tables.forEach((table) => {
    lines.push(`### Table: \`${table.name}\` (${table.estimatedRowCount || 0} rows)\n`)
    lines.push('| Column | Type | Format | Key | Default |')
    lines.push('| :--- | :--- | :--- | :--- | :--- |')
    table.columns.forEach((col) => {
      const keyInfo = col.isPrimaryKey
        ? '`PK`'
        : col.foreignKey
          ? `\`FK -> ${col.foreignKey.targetTable}.${col.foreignKey.targetColumn}\``
          : '-'
      const defVal = col.defaultValue ? `\`${col.defaultValue}\`` : '-'
      lines.push(`| **${col.name}** | \`${col.dataType || '-'}\` | \`${col.format || '-'}\` | ${keyInfo} | ${defVal} |`)
    })
    lines.push('')
  })

  return lines.join('\n')
}

// SVG Generator for PNG/SVG Export
function generateSchemaSvg(
  nodes: Node<{ table: TableDefinition }>[],
  edges: any[],
  isDark: boolean
): { svgString: string; width: number; height: number } {
  const nodeWidth = 260
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity

  nodes.forEach((n) => {
    const table = n.data?.table
    if (!table) return
    const colCount = table.columns?.length || 0
    const nodeHeight = 40 + colCount * 28 + 12
    if (n.position.x < minX) minX = n.position.x
    if (n.position.y < minY) minY = n.position.y
    if (n.position.x + nodeWidth > maxX) maxX = n.position.x + nodeWidth
    if (n.position.y + nodeHeight > maxY) maxY = n.position.y + nodeHeight
  })

  if (!isFinite(minX)) {
    minX = 0
    minY = 0
    maxX = 800
    maxY = 600
  }

  const padding = 60
  const width = Math.max(maxX - minX + padding * 2, 400)
  const height = Math.max(maxY - minY + padding * 2, 300)
  const originX = minX - padding
  const originY = minY - padding

  const bgColor = isDark ? '#121212' : '#ffffff'
  const cardBg = isDark ? '#181818' : '#ffffff'
  const headerBg = isDark ? '#222222' : '#f3f4f6'
  const borderColor = isDark ? '#2e2e2e' : '#e5e7eb'
  const textColor = isDark ? '#f3f4f6' : '#111827'
  const mutedText = isDark ? '#888888' : '#6b7280'
  const edgeColor = '#38bdf8'
  const pkColor = '#f59e0b'
  const fkColor = '#38bdf8'

  const edgeElements = edges
    .map((e) => {
      const sourceNode = nodes.find((n) => n.id === e.source)
      const targetNode = nodes.find((n) => n.id === e.target)
      if (!sourceNode || !targetNode) return ''

      const sourceColIndex =
        sourceNode.data.table.columns.findIndex(
          (c) => `${sourceNode.id}-${c.name}-source` === e.sourceHandle
        ) || 0
      const targetColIndex =
        targetNode.data.table.columns.findIndex(
          (c) => `${targetNode.id}-${c.name}-target` === e.targetHandle
        ) || 0

      const sx = sourceNode.position.x + nodeWidth
      const sy = sourceNode.position.y + 40 + Math.max(0, sourceColIndex) * 28 + 14
      const tx = targetNode.position.x
      const ty = targetNode.position.y + 40 + Math.max(0, targetColIndex) * 28 + 14

      const dx = Math.max(Math.abs(tx - sx) * 0.45, 40)
      const d = `M ${sx} ${sy} C ${sx + dx} ${sy}, ${tx - dx} ${ty}, ${tx} ${ty}`

      return `
        <path d="${d}" fill="none" stroke="${edgeColor}" stroke-width="2" stroke-linecap="round" opacity="0.85" />
        <circle cx="${sx}" cy="${sy}" r="3" fill="${edgeColor}" />
        <circle cx="${tx}" cy="${ty}" r="3" fill="${edgeColor}" />
      `
    })
    .join('\n')

  const nodeElements = nodes
    .map((n) => {
      const table = n.data?.table
      if (!table) return ''
      const colCount = table.columns?.length || 0
      const nodeHeight = 40 + colCount * 28 + 12

      const cols = table.columns
        .map((col, idx) => {
          const cy = 40 + idx * 28 + 18
          const keyLabel = col.isPrimaryKey ? 'PK' : col.foreignKey ? 'FK' : ''
          const keyColor = col.isPrimaryKey ? pkColor : fkColor

          return `
            <line x1="0" y1="${40 + idx * 28}" x2="${nodeWidth}" y2="${40 + idx * 28}" stroke="${borderColor}" stroke-width="1" />
            <text x="14" y="${cy}" font-family="monospace" font-size="11" fill="${col.isPrimaryKey ? pkColor : textColor}" font-weight="${col.isPrimaryKey ? 'bold' : 'normal'}">${col.name}</text>
            <text x="${nodeWidth - 14}" y="${cy}" font-family="sans-serif" font-size="10" text-anchor="end" fill="${mutedText}">
              ${col.format || col.dataType || ''} ${keyLabel ? `<tspan fill="${keyColor}" font-weight="bold"> ${keyLabel}</tspan>` : ''}
            </text>
          `
        })
        .join('\n')

      return `
        <g transform="translate(${n.position.x}, ${n.position.y})">
          <rect width="${nodeWidth}" height="${nodeHeight}" rx="8" fill="${cardBg}" stroke="${borderColor}" stroke-width="1.5" />
          <rect width="${nodeWidth}" height="38" rx="8" fill="${headerBg}" stroke="${borderColor}" stroke-width="1.5" />
          <rect y="30" width="${nodeWidth}" height="8" fill="${headerBg}" />
          <text x="14" y="24" font-family="monospace" font-size="12" font-weight="bold" fill="${textColor}">${table.name}</text>
          <text x="${nodeWidth - 14}" y="24" font-family="sans-serif" font-size="10" text-anchor="end" fill="${mutedText}">${table.estimatedRowCount} rows</text>
          ${cols}
        </g>
      `
    })
    .join('\n')

  const svgString = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="${originX} ${originY} ${width} ${height}">
      <rect x="${originX}" y="${originY}" width="${width}" height="${height}" fill="${bgColor}" />
      ${edgeElements}
      ${nodeElements}
    </svg>
  `.trim()

  return { svgString, width, height }
}

function SchemaVisualizerInner() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const { fitView } = useReactFlow()

  const [selectedSchema, setSelectedSchema] = useState('public')
  const [searchQuery, setSearchQuery] = useState('')
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const showToast = useCallback((msg: string) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current)
    setToastMessage(msg)
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage(null)
    }, 2500)
  }, [])

  const currentSchemaData = MOCK_SCHEMAS.find((s) => s.name === selectedSchema) || MOCK_SCHEMAS[0]

  // Compute Initial Nodes layout
  const initialNodes = useMemo(() => {
    return currentSchemaData.tables.map((table, index) => {
      const col = index % 3
      const row = Math.floor(index / 3)
      return {
        id: table.name,
        type: 'tableNode',
        position: { x: 50 + col * 340, y: 50 + row * 280 },
        data: { table, isHighlighted: false, isDimmed: false },
      }
    })
  }, [currentSchemaData])

  // Compute Initial Edges from Foreign Keys
  const initialEdges = useMemo(() => {
    const edges: any[] = []
    currentSchemaData.tables.forEach((table) => {
      table.columns.forEach((col) => {
        if (col.foreignKey) {
          edges.push({
            id: `edge-${table.name}.${col.name}-${col.foreignKey.targetTable}`,
            source: table.name,
            sourceHandle: `${table.name}-${col.name}-source`,
            target: col.foreignKey.targetTable,
            targetHandle: `${col.foreignKey.targetTable}-${col.foreignKey.targetColumn}-target`,
            animated: true,
            style: { stroke: '#38bdf8', strokeWidth: 1.75 },
          })
        }
      })
    })
    return edges
  }, [currentSchemaData])

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)

  // Switch schema & auto layout
  const handleSelectSchema = (schema: string) => {
    setSelectedSchema(schema)
  }

  // Update layout on schema change
  useEffect(() => {
    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(initialNodes, initialEdges)
    setNodes(layoutedNodes)
    setEdges(layoutedEdges)
    setTimeout(() => {
      fitView({ padding: 0.2, duration: 400 })
    }, 80)
  }, [selectedSchema, initialNodes, initialEdges, fitView, setNodes, setEdges])

  // Update highlighted and dimmed state on nodes when searchQuery changes
  useEffect(() => {
    const query = searchQuery.trim().toLowerCase()
    setNodes((prevNodes) =>
      prevNodes.map((n) => {
        const match = query ? n.data.table.name.toLowerCase().includes(query) : false
        return {
          ...n,
          data: {
            ...n.data,
            isHighlighted: match,
            isDimmed: query ? !match : false,
          },
        }
      })
    )
  }, [searchQuery, setNodes])

  // Auto Layout action
  const handleAutoLayout = useCallback(() => {
    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(nodes, edges)
    setNodes([...layoutedNodes])
    setEdges([...layoutedEdges])
    setTimeout(() => {
      fitView({ padding: 0.2, duration: 400 })
    }, 50)
  }, [nodes, edges, fitView, setNodes, setEdges])

  // Search Enter key focuses matching table
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const query = searchQuery.trim().toLowerCase()
      if (!query) return
      const matchedNode = nodes.find((n) => n.data.table.name.toLowerCase().includes(query))
      if (matchedNode) {
        fitView({
          nodes: [{ id: matchedNode.id }],
          duration: 500,
          padding: 0.8,
        })
      }
    }
  }

  // Copy as SQL
  const handleCopyAsSql = useCallback(() => {
    try {
      const sql = generateSql(currentSchemaData.tables, selectedSchema)
      navigator.clipboard.writeText(sql)
      showToast('Copied SQL schema to clipboard!')
    } catch (err) {
      console.error('Failed to copy SQL:', err)
    }
  }, [currentSchemaData, selectedSchema, showToast])

  // Copy as Markdown
  const handleCopyAsMarkdown = useCallback(() => {
    try {
      const md = generateMarkdown(currentSchemaData.tables, selectedSchema)
      navigator.clipboard.writeText(md)
      showToast('Copied Markdown schema to clipboard!')
    } catch (err) {
      console.error('Failed to copy Markdown:', err)
    }
  }, [currentSchemaData, selectedSchema, showToast])

  // Download as PNG
  const handleDownloadPng = useCallback(() => {
    try {
      const { svgString, width, height } = generateSchemaSvg(nodes as any, edges, isDark)
      const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const img = new Image()
      img.onload = () => {
        const scale = 2
        const canvas = document.createElement('canvas')
        canvas.width = width * scale
        canvas.height = height * scale
        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.scale(scale, scale)
          ctx.drawImage(img, 0, 0)
          const pngUrl = canvas.toDataURL('image/png')
          const link = document.createElement('a')
          link.href = pngUrl
          link.download = `${selectedSchema}-schema.png`
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
        }
        URL.revokeObjectURL(url)
        showToast('Downloaded schema as PNG')
      }
      img.onerror = () => {
        URL.revokeObjectURL(url)
      }
      img.src = url
    } catch (err) {
      console.error('Failed to download PNG:', err)
    }
  }, [nodes, edges, isDark, selectedSchema, showToast])

  // Download as SVG
  const handleDownloadSvg = useCallback(() => {
    try {
      const { svgString } = generateSchemaSvg(nodes as any, edges, isDark)
      const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${selectedSchema}-schema.svg`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      showToast('Downloaded schema as SVG')
    } catch (err) {
      console.error('Failed to download SVG:', err)
    }
  }, [nodes, edges, isDark, selectedSchema, showToast])

  return (
    <div className="flex flex-col h-full w-full overflow-hidden bg-studio relative">
      {/* Toast Notification positioned at bottom right */}
      {toastMessage && (
        <Alert
          position="bottom-right"
          variant="success"
          onClose={() => setToastMessage(null)}
        >
          {toastMessage}
        </Alert>
      )}

      {/* Top Toolbar matching screenshot exactly */}
      <div className="h-11 shrink-0 border-b border-default bg-dash-sidebar flex items-center justify-between px-4 z-10 select-none">
        {/* Left Side: Schema Selector & Find Table */}
        <div className="flex items-center gap-2">
          <SchemaSelector
            selectedSchema={selectedSchema}
            onSelectSchema={handleSelectSchema}
            schemas={MOCK_SCHEMAS.map((s) => s.name)}
          />

          <div className="relative flex items-center">
            <Search className="absolute left-2.5 h-3.5 w-3.5 text-foreground-lighter pointer-events-none" />
            <input
              type="text"
              placeholder="Find table..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              className="h-7 pl-8 pr-6 w-44 rounded-md border border-strong bg-surface-100 hover:bg-surface-200/50 focus:bg-surface-100 text-xs text-foreground placeholder:text-foreground-lighter focus:outline-none focus:ring-1 focus:ring-brand-500 transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 text-foreground-lighter hover:text-foreground text-[10px] cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Right Side: Split Button (Copy as SQL / dropdown) and Auto layout */}
        <div className="flex items-center gap-2">
          {/* Split button */}
          <div className="inline-flex items-center rounded-md border border-strong bg-surface-100 overflow-hidden shadow-xs">
            <button
              type="button"
              onClick={handleCopyAsSql}
              className="h-7 px-2.5 flex items-center gap-1.5 text-xs font-medium text-foreground hover:bg-surface-200 transition-colors cursor-pointer"
              title="Copy schema as SQL"
            >
              <Copy className="h-3.5 w-3.5 text-foreground-light shrink-0" />
              <span>Copy as SQL</span>
            </button>
            <div className="w-[1px] h-4 bg-border-strong self-center" />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="h-7 px-1.5 flex items-center justify-center text-foreground-light hover:text-foreground hover:bg-surface-200 transition-colors cursor-pointer"
                  aria-label="More export options"
                >
                  <ChevronDown className="h-3.5 w-3.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-overlay border border-overlay p-1 shadow-xl rounded-md">
                <DropdownMenuItem
                  onClick={handleCopyAsMarkdown}
                  className="flex items-center gap-2 px-2.5 py-1.5 text-xs cursor-pointer hover:bg-surface-200 rounded"
                >
                  <Copy className="h-3.5 w-3.5 text-foreground-lighter" />
                  <span>Copy as Markdown</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleDownloadPng}
                  className="flex items-center gap-2 px-2.5 py-1.5 text-xs cursor-pointer hover:bg-surface-200 rounded"
                >
                  <Download className="h-3.5 w-3.5 text-foreground-lighter" />
                  <span>Download as PNG</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleDownloadSvg}
                  className="flex items-center gap-2 px-2.5 py-1.5 text-xs cursor-pointer hover:bg-surface-200 rounded"
                >
                  <Download className="h-3.5 w-3.5 text-foreground-lighter" />
                  <span>Download as SVG</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Auto layout button */}
          <button
            type="button"
            onClick={handleAutoLayout}
            className="h-7 px-3 text-xs font-medium text-foreground bg-surface-100 hover:bg-surface-200 border border-strong rounded-md transition-colors cursor-pointer shadow-xs"
          >
            Auto layout
          </button>
        </div>
      </div>

      {/* Interactive Entity Relationship Canvas */}
      <div className="flex-1 w-full h-full relative bg-[#FAFAFA] dark:bg-[#121212]">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          fitView
          minZoom={0.2}
          maxZoom={2}
          colorMode={isDark ? 'dark' : 'light'}
          proOptions={{ hideAttribution: true }}
          className="!bg-transparent"
        >
          <Background
            variant={BackgroundVariant.Dots}
            gap={20}
            size={1}
            color={isDark ? '#2e2e2e' : '#D1D5DB'}
            bgColor="transparent"
          />
          <Controls
            showInteractive={false}
            className="!shadow-none overflow-hidden rounded-md border border-default"
          />
          <MiniMap
            pannable
            zoomable
            bgColor={isDark ? '#171717' : '#ffffff'}
            nodeColor={isDark ? '#2e2e2e' : '#e5e7eb'}
            nodeStrokeColor={isDark ? '#3e3e3e' : '#d1d5db'}
            nodeBorderRadius={4}
            maskColor={isDark ? 'rgba(0, 0, 0, 0.55)' : 'rgba(240, 240, 240, 0.6)'}
            className="!shadow-none overflow-hidden rounded-md border border-default"
          />
        </ReactFlow>
      </div>
    </div>
  )
}

export function SchemaVisualizerView() {
  return (
    <ReactFlowProvider>
      <SchemaVisualizerInner />
    </ReactFlowProvider>
  )
}
