import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { cn } from "@/lib/utils";
export function DataTable({
  rows,
  columns,
  searchKeys,
  pageSize = 8,
  toolbar,
}) {
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const filtered = useMemo(() => {
    if (!q || !searchKeys?.length) return rows;
    const needle = q.toLowerCase();
    return rows.filter((r) =>
      searchKeys.some((k) =>
        String(r[k] ?? "")
          .toLowerCase()
          .includes(needle),
      ),
    );
  }, [rows, q, searchKeys]);
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, pages);
  const slice = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);
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
              placeholder="Search…"
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
            {slice.map((row) => (
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
            {slice.length === 0 && (
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
        <div>
          Showing{" "}
          <span className="font-medium text-foreground">{slice.length}</span> of{" "}
          <span className="font-medium text-foreground">{filtered.length}</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={safePage === 1}
            className="h-8 w-8 inline-flex items-center justify-center rounded-md border border-border hover:bg-accent disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="px-2">
            Page {safePage} / {pages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(pages, p + 1))}
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
