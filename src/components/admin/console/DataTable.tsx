import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SearchInput } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { downloadCsv, type CsvCell } from './csv';
import { EmptyState, Skeleton } from './primitives';

export interface Column<T> {
  key: string;
  header: string;
  /** Rendered cell. */
  cell: (row: T) => ReactNode;
  /** Makes the column sortable. */
  sortValue?: (row: T) => string | number | null | undefined;
  /** Value written to CSV (omit to exclude the column from the export). */
  csv?: (row: T) => CsvCell;
  align?: 'left' | 'right';
  /** On phones the first column becomes the card title; this hides a column from cards. */
  hideOnMobile?: boolean;
  /** Renders the cell as an action row at the bottom of the mobile card. */
  isActions?: boolean;
  className?: string;
  /** Only exported to CSV, never rendered. */
  csvOnly?: boolean;
}

export interface FilterDef<T> {
  key: string;
  label: string;
  options: { value: string; label: string }[];
  match: (row: T, value: string) => boolean;
}

interface DataTableProps<T> {
  rows: T[] | undefined;
  columns: Column<T>[];
  rowKey: (row: T) => string;
  /** Text used by the search box. Omit to hide search. */
  searchText?: (row: T) => string;
  searchLabel?: string;
  filters?: FilterDef<T>[];
  pageSize?: number;
  onRowClick?: (row: T) => void;
  exportName?: string;
  emptyTitle?: string;
  emptyBody?: ReactNode;
  toolbar?: ReactNode;
  /** Enables row checkboxes; renders `bulkActions` when something is selected. */
  selectable?: boolean;
  bulkActions?: (selected: T[], clear: () => void) => ReactNode;
  caption: string;
}

export function DataTable<T>({
  rows,
  columns: allColumns,
  rowKey,
  searchText,
  searchLabel = 'Search',
  filters = [],
  pageSize = 10,
  onRowClick,
  exportName,
  emptyTitle = 'Nothing here yet',
  emptyBody,
  toolbar,
  selectable,
  bulkActions,
  caption,
}: DataTableProps<T>) {
  const columns = useMemo(() => allColumns.filter((c) => !c.csvOnly), [allColumns]);
  const [query, setQuery] = useState('');
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  const [sort, setSort] = useState<{ key: string; dir: 'asc' | 'desc' } | null>(null);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(pageSize);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const processed = useMemo(() => {
    let out = rows ?? [];
    const q = query.trim().toLowerCase();
    if (q && searchText) out = out.filter((r) => searchText(r).toLowerCase().includes(q));
    for (const f of filters) {
      const v = filterValues[f.key];
      if (v) out = out.filter((r) => f.match(r, v));
    }
    if (sort) {
      const col = columns.find((c) => c.key === sort.key);
      if (col?.sortValue) {
        const sv = col.sortValue;
        out = [...out].sort((a, b) => {
          const av = sv(a) ?? '';
          const bv = sv(b) ?? '';
          const cmp = typeof av === 'number' && typeof bv === 'number' ? av - bv : String(av).localeCompare(String(bv), undefined, { numeric: true });
          return sort.dir === 'asc' ? cmp : -cmp;
        });
      }
    }
    return out;
  }, [rows, query, filterValues, sort, columns, filters, searchText]);

  const pages = Math.max(1, Math.ceil(processed.length / size));
  useEffect(() => setPage(0), [query, filterValues, size, sort]);
  const current = Math.min(page, pages - 1);
  const visible = processed.slice(current * size, current * size + size);
  const selectedRows = (rows ?? []).filter((r) => selected.has(rowKey(r)));
  const allVisibleSelected = visible.length > 0 && visible.every((r) => selected.has(rowKey(r)));

  const toggleSort = (key: string) =>
    setSort((s) => (s?.key !== key ? { key, dir: 'asc' } : s.dir === 'asc' ? { key, dir: 'desc' } : null));

  const exportCsv = () => {
    const cols = allColumns.filter((c) => c.csv);
    downloadCsv(exportName ?? 'export', cols.map((c) => c.header), processed.map((r) => cols.map((c) => c.csv!(r))));
  };

  const loading = rows === undefined;
  const titleCol = columns[0];
  const actionCols = columns.filter((c) => c.isActions);
  const mobileCols = columns.slice(1).filter((c) => !c.hideOnMobile && !c.isActions);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end gap-3">
        {searchText && (
          <div className="min-w-[12rem] flex-1 sm:max-w-xs">
            <SearchInput value={query} onValueChange={setQuery} aria-label={searchLabel} placeholder={searchLabel} />
          </div>
        )}
        {filters.map((f) => (
          <div key={f.key} className="w-44">
            <Select
              aria-label={f.label}
              placeholder={f.label}
              value={filterValues[f.key] ?? ''}
              onValueChange={(v) => setFilterValues((p) => ({ ...p, [f.key]: v }))}
              options={f.options}
              clearable
            />
          </div>
        ))}
        <div className="ml-auto flex items-center gap-2">
          {toolbar}
          {exportName && (
            <Button variant="outline" size="sm" onClick={exportCsv} disabled={!processed.length} className="pointer-events-auto">
              <Download className="mr-2 h-4 w-4" aria-hidden="true" /> Export CSV
            </Button>
          )}
        </div>
      </div>

      {selectable && selectedRows.length > 0 && bulkActions && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl bg-[hsl(var(--brand-strong))]/10 px-4 py-2.5 text-sm" role="region" aria-label="Bulk actions">
          <span className="font-medium">{selectedRows.length} selected</span>
          {bulkActions(selectedRows, () => setSelected(new Set()))}
          <button type="button" onClick={() => setSelected(new Set())} className="ml-auto text-muted-foreground underline">
            Clear
          </button>
        </div>
      )}

      {/* Desktop / tablet table */}
      <div className="hidden overflow-hidden rounded-lg border border-border bg-card md:block">
        <div className="max-h-[70vh] overflow-auto">
          <table className="w-full border-collapse text-sm">
            <caption className="sr-only">{caption}</caption>
            <thead className="sticky top-0 z-10 bg-[hsl(var(--secondary))] text-left">
              <tr>
                {selectable && (
                  <th scope="col" className="w-10 px-3 py-3">
                    <input
                      type="checkbox"
                      aria-label="Select all rows on this page"
                      checked={allVisibleSelected}
                      onChange={(e) =>
                        setSelected((prev) => {
                          const next = new Set(prev);
                          visible.forEach((r) => (e.target.checked ? next.add(rowKey(r)) : next.delete(rowKey(r))));
                          return next;
                        })
                      }
                      className="h-4 w-4 accent-[hsl(var(--brand-strong))]"
                    />
                  </th>
                )}
                {columns.map((c) => {
                  const sorted = sort?.key === c.key ? sort.dir : null;
                  return (
                    <th
                      key={c.key}
                      scope="col"
                      aria-sort={sorted ? (sorted === 'asc' ? 'ascending' : 'descending') : undefined}
                      className={cn('whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground', c.align === 'right' && 'text-right', c.className)}
                    >
                      {c.sortValue ? (
                        <button
                          type="button"
                          onClick={() => toggleSort(c.key)}
                          className="inline-flex items-center gap-1 rounded hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          {c.header}
                          {sorted === 'asc' ? <ArrowUp className="h-3.5 w-3.5" aria-hidden="true" /> : sorted === 'desc' ? <ArrowDown className="h-3.5 w-3.5" aria-hidden="true" /> : <ArrowUpDown className="h-3.5 w-3.5 opacity-50" aria-hidden="true" />}
                        </button>
                      ) : (
                        c.header
                      )}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-background">
              {loading &&
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {(selectable ? [null, ...columns] : columns).map((_, j) => (
                      <td key={j} className="px-4 py-3"><Skeleton className="h-5 w-full" /></td>
                    ))}
                  </tr>
                ))}
              {!loading &&
                visible.map((r) => {
                  const k = rowKey(r);
                  return (
                    <tr
                      key={k}
                      tabIndex={onRowClick ? 0 : undefined}
                      onClick={onRowClick ? () => onRowClick(r) : undefined}
                      onKeyDown={onRowClick ? (e) => { if (e.key === 'Enter' && e.target === e.currentTarget) onRowClick(r); } : undefined}
                      className={cn('hover:bg-accent/40', onRowClick && 'cursor-pointer focus-visible:bg-accent/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring')}
                    >
                      {selectable && (
                        <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            aria-label="Select row"
                            checked={selected.has(k)}
                            onChange={(e) =>
                              setSelected((prev) => {
                                const next = new Set(prev);
                                if (e.target.checked) next.add(k); else next.delete(k);
                                return next;
                              })
                            }
                            className="h-4 w-4 accent-[hsl(var(--brand-strong))]"
                          />
                        </td>
                      )}
                      {columns.map((c) => (
                        <td
                          key={c.key}
                          onClick={c.isActions ? (e) => e.stopPropagation() : undefined}
                          className={cn('px-4 py-3 align-middle text-foreground', c.align === 'right' && 'text-right', c.className)}
                        >
                          {c.cell(r)}
                        </td>
                      ))}
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Phone cards */}
      <ul className="space-y-3 md:hidden" aria-label={caption}>
        {loading && Array.from({ length: 3 }).map((_, i) => <li key={i}><Skeleton className="h-28 w-full rounded-lg" /></li>)}
        {!loading &&
          visible.map((r) => (
            <li key={rowKey(r)} className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-start gap-3">
                {selectable && (
                  <input
                    type="checkbox"
                    aria-label="Select row"
                    checked={selected.has(rowKey(r))}
                    onChange={(e) =>
                      setSelected((prev) => {
                        const next = new Set(prev);
                        if (e.target.checked) next.add(rowKey(r)); else next.delete(rowKey(r));
                        return next;
                      })
                    }
                    className="mt-1 h-4 w-4 accent-[hsl(var(--brand-strong))]"
                  />
                )}
                <div
                  className={cn('min-w-0 flex-1', onRowClick && 'cursor-pointer')}
                  onClick={onRowClick ? () => onRowClick(r) : undefined}
                >
                  <div className="font-medium text-foreground">{titleCol.cell(r)}</div>
                  <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
                    {mobileCols.map((c) => (
                      <div key={c.key} className="contents">
                        <dt className="text-muted-foreground">{c.header}</dt>
                        <dd className="min-w-0 text-right text-foreground">{c.cell(r)}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              </div>
              {actionCols.length > 0 && (
                <div className="mt-3 flex flex-wrap justify-end gap-2 border-t border-border pt-3">
                  {actionCols.map((c) => <div key={c.key}>{c.cell(r)}</div>)}
                </div>
              )}
            </li>
          ))}
      </ul>

      {!loading && processed.length === 0 && (
        <EmptyState title={rows && rows.length > 0 ? 'No results match your filters' : emptyTitle}>
          {rows && rows.length > 0 ? 'Try a different search or clear the filters.' : emptyBody}
        </EmptyState>
      )}

      {!loading && processed.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
          <span>
            {current * size + 1}-{Math.min((current + 1) * size, processed.length)} of {processed.length}
          </span>
          <div className="flex items-center gap-2">
            <div className="w-32">
              <Select
                aria-label="Rows per page"
                value={String(size)}
                onValueChange={(v) => setSize(Number(v) || pageSize)}
                options={[10, 25, 50].map((n) => ({ value: String(n), label: `${n} rows` }))}
              />
            </div>
            <Button variant="outline" size="icon" aria-label="Previous page" disabled={current === 0} onClick={() => setPage(current - 1)} className="pointer-events-auto">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span aria-live="polite">Page {current + 1} of {pages}</span>
            <Button variant="outline" size="icon" aria-label="Next page" disabled={current >= pages - 1} onClick={() => setPage(current + 1)} className="pointer-events-auto">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
