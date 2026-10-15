# Supabase Studio Lite (Database UI)

A frontend-only, pixel-identical replica of **Supabase Studio's Database UI**. Built with Next.js App Router, Tailwind CSS, Monaco Editor, and @xyflow/react.

## ✨ Implemented Sections

1. **Dashboard / Project Home (`/`)**
   - Project header with environment badge, region, and engine version
   - Direct & Pooler connection popover with one-click copy
   - Stat cards: Database disk size, connection pool, CPU usage, RAM
   - Throughput & error charts (24h time-series)
   - Infrastructure status badges (PostgreSQL 15.6, RLS Security, Supavisor)

2. **Table Editor (`/tables` or `/table-editor`)**
   - Left sidebar with Schema switcher (`public`, `auth`) and table search
   - Full data grid with row checkboxes, sticky header, data type labels, and primary key icons
   - Filtering & sorting toolbars
   - Row creation modal (`Insert row`)
   - Export to CSV
   - Data / Definition view mode switcher

3. **SQL Editor (`/sql` or `/sql-editor`)**
   - Left sidebar with saved queries and quickstart templates
   - Multi-tab query editor
   - Full Monaco code editor with PostgreSQL syntax highlighting
   - Run query button (with `⌘⏎` keyboard shortcut hint) and format query button
   - Results panel with row counts, execution time, and CSV export

4. **Schema Visualizer (`/visualizer` or `/database/schemas`)**
   - Interactive Entity-Relationship graph canvas using `@xyflow/react`
   - Dark dot-grid background, zoom/pan controls, and mini-map
   - Custom table nodes showing column types, primary key (`PK`) badges, and foreign key (`FK`) links
   - Directed relationship edges connecting foreign keys to target primary keys

5. **Shell & Navigation**
   - Left icon rail with official Supabase SVG logo and active tab indicators
   - Top breadcrumb bar with active project status
   - Global command palette (`⌘K`) for instant jump across sections, tables, and SQL queries

## 🚀 Running Locally

```bash
cd Studio-Lite
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.
