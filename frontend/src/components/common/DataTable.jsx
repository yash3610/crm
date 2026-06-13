import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
export function DataTable({
  rows,
  columns,
  searchKeys,
  pageSize = 8,
  toolbar,
  pagination,
  onPageChange,
  onPageSizeChange,
  onSearchChange,
  loading = false,
}) {
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const serverSide = Boolean(pagination && onPageChange);

  useEffect(() => {
    if (!serverSide || !onSearchChange) return;
    const timer = window.setTimeout(() => onSearchChange(q), 350);
    return () => window.clearTimeout(timer);
  }, [onSearchChange, q, serverSide]);

  const filtered = useMemo(() => {
    if (serverSide) return rows;
    if (!q || !searchKeys?.length) return rows;
    const needle = q.toLowerCase();
    return rows.filter((r) =>
      searchKeys.some((k) =>
        String(r[k] ?? "")
          .toLowerCase()
          .includes(needle),
      ),
    );
  }, [rows, q, searchKeys, serverSide]);
  const effectivePageSize = serverSide ? pagination.limit : pageSize;
  const pages = serverSide
    ? pagination.pages
    : Math.max(1, Math.ceil(filtered.length / effectivePageSize));
  const safePage = serverSide ? pagination.page : Math.min(page, pages);
  const slice = serverSide
    ? filtered
    : filtered.slice(
        (safePage - 1) * effectivePageSize,
        safePage * effectivePageSize,
      );
  const total = serverSide ? pagination.total : filtered.length;
  const start = total ? (safePage - 1) * effectivePageSize + 1 : 0;
  const end = total ? Math.min(start + slice.length - 1, total) : 0;
  return (
    <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between p-4 border-b border-border">
        {searchKeys && (
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(1);
              }}
              placeholder="Search..."
              className="w-full h-9 pl-9 pr-3 rounded-lg bg-muted/60 border border-transparent focus:bg-background focus:border-border outline-none text-sm"
            />
          </div>
        )}
        {toolbar && (
          <div className="flex items-center gap-2 flex-wrap">{toolbar}</div>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground bg-muted/40">
              {columns.map((c) => (
                <th
                  key={c.key}
                  className={cn("px-4 py-2.5 font-medium", c.className)}
                >
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {!loading &&
              slice.map((row) => (
                <tr
                  key={row.id}
                  className="border-t border-border hover:bg-muted/30 transition-colors"
                >
                  {columns.map((c) => (
                    <td
                      key={c.key}
                      className={cn("px-4 py-3 align-middle", c.className)}
                    >
                      {c.render(row)}
                    </td>
                  ))}
                </tr>
              ))}
            {loading && (
              <>
                {Array.from({ length: Math.min(effectivePageSize, 8) }).map(
                  (_, rowIndex) => (
                    <tr key={rowIndex} className="border-t border-border">
                      {columns.map((column, columnIndex) => (
                        <td
                          key={column.key}
                          className={cn(
                            "px-4 py-3 align-middle",
                            column.className,
                          )}
                        >
                          <div
                            className={cn(
                              "flex",
                              column.className?.includes("text-right") &&
                                "justify-end",
                            )}
                          >
                            <Skeleton
                              className={cn(
                                "h-4",
                                columnIndex === 0
                                  ? "w-36"
                                  : columnIndex % 3 === 0
                                    ? "w-20"
                                    : "w-24",
                              )}
                            />
                          </div>
                        </td>
                      ))}
                    </tr>
                  ),
                )}
              </>
            )}
            {!loading && slice.length === 0 && (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-12 text-center text-sm text-muted-foreground"
                >
                  No results found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between px-4 py-3 border-t border-border text-xs text-muted-foreground">
        {loading ? (
          <Skeleton className="h-4 w-32" />
        ) : (
          <div>
            Showing <span className="font-medium text-foreground">{start}</span>
            {" - "}
            <span className="font-medium text-foreground">{end}</span> of{" "}
            <span className="font-medium text-foreground">{total}</span>
          </div>
        )}
        <div className="flex items-center gap-2">
          {serverSide && onPageSizeChange && (
            <select
              value={effectivePageSize}
              onChange={(event) => onPageSizeChange(Number(event.target.value))}
              className="h-8 rounded-md border border-border bg-background px-2"
              aria-label="Rows per page"
            >
              {[8, 10, 20, 50].map((size) => (
                <option key={size} value={size}>
                  {size} / page
                </option>
              ))}
            </select>
          )}
          <button
            onClick={() =>
              serverSide
                ? onPageChange(Math.max(1, safePage - 1))
                : setPage((current) => Math.max(1, current - 1))
            }
            disabled={safePage === 1}
            className="h-8 w-8 inline-flex items-center justify-center rounded-md border border-border hover:bg-accent disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          {loading ? (
            <Skeleton className="h-4 w-16" />
          ) : (
            <span className="px-2">
              Page {safePage} / {pages}
            </span>
          )}
          <button
            onClick={() =>
              serverSide
                ? onPageChange(Math.min(pages, safePage + 1))
                : setPage((current) => Math.min(pages, current + 1))
            }
            disabled={safePage === pages}
            className="h-8 w-8 inline-flex items-center justify-center rounded-md border border-border hover:bg-accent disabled:opacity-40"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
